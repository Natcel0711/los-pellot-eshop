using LosPellot.Api.Controllers;
using LosPellot.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Tests;

public class IdempotencyTests
{
    [Fact]
    public async Task Checkout_ReplayedIdempotencyKey_NeverCreatesASecondOrder()
    {
        using var connection = TestDb.OpenSharedConnection(Guid.NewGuid().ToString("N"));
        var db = TestDb.CreateContext(connection);
        await db.Database.EnsureCreatedAsync();

        db.Categories.Add(TestFactory.MakeCategory());
        db.Products.Add(TestFactory.MakeProduct("p1", "cat1", 15m, stock: 10));
        await db.SaveChangesAsync();

        var guestToken = Guid.NewGuid().ToString("N");
        await TestFactory.SeedCartAsync(db, userId: null, guestToken, ("p1", 1));

        var idemKey = Guid.NewGuid().ToString();
        var controller = new OrdersController(db, new Services.CartResolver(db), new CountingPaymentService())
        {
            ControllerContext = TestFactory.MakeControllerContext(TestFactory.GuestPrincipal(), guestToken, idemKey),
        };

        var first = Assert.IsType<OrderDto>(Assert.IsType<OkObjectResult>((await controller.Checkout(new CreateOrderRequest(TestFactory.MakeShipping()))).Result).Value);
        var second = Assert.IsType<OrderDto>(Assert.IsType<OkObjectResult>((await controller.Checkout(new CreateOrderRequest(TestFactory.MakeShipping()))).Result).Value);

        Assert.Equal(first.OrderNumber, second.OrderNumber);
        Assert.Equal(1, await db.Orders.CountAsync());
    }

    [Fact]
    public async Task ConfirmPayment_ReplayedIdempotencyKey_CallsProviderOnlyOnceAndNeverDuplicatesPayment()
    {
        using var connection = TestDb.OpenSharedConnection(Guid.NewGuid().ToString("N"));
        var db = TestDb.CreateContext(connection);
        await db.Database.EnsureCreatedAsync();

        db.Categories.Add(TestFactory.MakeCategory());
        db.Products.Add(TestFactory.MakeProduct("p1", "cat1", 15m, stock: 10));
        await db.SaveChangesAsync();

        var guestToken = Guid.NewGuid().ToString("N");
        await TestFactory.SeedCartAsync(db, userId: null, guestToken, ("p1", 1));

        var counting = new CountingPaymentService();
        var checkoutController = new OrdersController(db, new Services.CartResolver(db), counting)
        {
            ControllerContext = TestFactory.MakeControllerContext(TestFactory.GuestPrincipal(), guestToken),
        };
        var order = Assert.IsType<OrderDto>(Assert.IsType<OkObjectResult>((await checkoutController.Checkout(new CreateOrderRequest(TestFactory.MakeShipping()))).Result).Value);

        var confirmKey = Guid.NewGuid().ToString();
        var payController = new OrdersController(db, new Services.CartResolver(db), counting)
        {
            ControllerContext = TestFactory.MakeControllerContext(TestFactory.GuestPrincipal(), guestToken, confirmKey),
        };

        var firstPay = Assert.IsType<OrderDto>(Assert.IsType<OkObjectResult>(
            (await payController.ConfirmPayment(order.OrderNumber, order.Shipping.Email, new ConfirmPaymentRequest(TestFactory.MakeCard(), "Succeed"))).Result).Value);
        var secondPay = Assert.IsType<OrderDto>(Assert.IsType<OkObjectResult>(
            (await payController.ConfirmPayment(order.OrderNumber, order.Shipping.Email, new ConfirmPaymentRequest(TestFactory.MakeCard(), "Succeed"))).Result).Value);

        Assert.Equal("Paid", firstPay.PaymentStatus);
        Assert.Equal("Paid", secondPay.PaymentStatus);
        Assert.Equal(1, counting.ConfirmCallCount); // second call short-circuited on "already Paid"

        var orderId = (await db.Orders.FirstAsync(o => o.OrderNumber == order.OrderNumber)).Id;
        Assert.Equal(1, await db.Payments.CountAsync(p => p.OrderId == orderId));
    }
}
