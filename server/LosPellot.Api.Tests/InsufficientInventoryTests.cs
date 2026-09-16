using LosPellot.Api.Controllers;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using LosPellot.Api.Services;
using LosPellot.Api.Services.Payments;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Tests;

public class InsufficientInventoryTests
{
    [Fact]
    public async Task Checkout_WhenCartExceedsCurrentStock_RejectsWithNoOrderCreated()
    {
        using var connection = TestDb.OpenSharedConnection(Guid.NewGuid().ToString("N"));
        var db = TestDb.CreateContext(connection);
        await db.Database.EnsureCreatedAsync();

        db.Categories.Add(TestFactory.MakeCategory());
        db.Products.Add(TestFactory.MakeProduct("p1", "cat1", 10m, stock: 1));
        await db.SaveChangesAsync();

        var guestToken = Guid.NewGuid().ToString("N");
        await TestFactory.SeedCartAsync(db, userId: null, guestToken, ("p1", 2)); // wants 2, only 1 in stock

        var controller = new OrdersController(db, new CartResolver(db), new MockPaymentService())
        {
            ControllerContext = TestFactory.MakeControllerContext(TestFactory.GuestPrincipal(), guestToken),
        };

        var result = await controller.Checkout(new CreateOrderRequest(TestFactory.MakeShipping()));

        Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal(0, await db.Orders.CountAsync());
    }

    [Fact]
    public async Task ConfirmPayment_WhenStockRunsOutAfterOrderCreated_CancelsPaymentAndLeavesOrderPending()
    {
        using var connection = TestDb.OpenSharedConnection(Guid.NewGuid().ToString("N"));
        var db = TestDb.CreateContext(connection);
        await db.Database.EnsureCreatedAsync();

        db.Categories.Add(TestFactory.MakeCategory());
        db.Products.Add(TestFactory.MakeProduct("p1", "cat1", 10m, stock: 1));
        await db.SaveChangesAsync();

        var guestToken = Guid.NewGuid().ToString("N");
        await TestFactory.SeedCartAsync(db, userId: null, guestToken, ("p1", 1));

        var controller = new OrdersController(db, new CartResolver(db), new MockPaymentService())
        {
            ControllerContext = TestFactory.MakeControllerContext(TestFactory.GuestPrincipal(), guestToken),
        };

        var checkoutResult = await controller.Checkout(new CreateOrderRequest(TestFactory.MakeShipping()));
        var order = Assert.IsType<OrderDto>(Assert.IsType<OkObjectResult>(checkoutResult.Result).Value);

        // Simulate another purchase consuming the last unit between Phase A and Phase B.
        var product = await db.Products.FirstAsync(p => p.Id == "p1");
        product.StockQuantity = 0;
        await db.SaveChangesAsync();

        var payResult = await controller.ConfirmPayment(
            order.OrderNumber, order.Shipping.Email,
            new ConfirmPaymentRequest(TestFactory.MakeCard(), "Succeed")); // provider says yes; stock says no

        var conflict = Assert.IsType<ObjectResult>(payResult.Result);
        Assert.Equal(StatusCodes.Status409Conflict, conflict.StatusCode);

        var afterConflict = await db.Orders.Include(o => o.Payments).FirstAsync(o => o.OrderNumber == order.OrderNumber);
        Assert.Equal(OrderStatus.PendingPayment, afterConflict.Status); // no partial state
        Assert.Equal(PaymentStatus.Cancelled, afterConflict.PaymentStatus);
        Assert.Equal(PaymentStatus.Cancelled, afterConflict.Payments.Single().Status);

        product = await db.Products.FirstAsync(p => p.Id == "p1");
        Assert.Equal(0, product.StockQuantity); // never goes negative
    }
}
