using LosPellot.Api.Controllers;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using LosPellot.Api.Services;
using LosPellot.Api.Services.Payments;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Tests;

public class PaymentFailureTests
{
    [Fact]
    public async Task ConfirmPayment_WhenSimulatedFail_LeavesStockAndOrderUntouchedAndAllowsRetry()
    {
        using var connection = TestDb.OpenSharedConnection(Guid.NewGuid().ToString("N"));

        var setupDb = TestDb.CreateContext(connection);
        await setupDb.Database.EnsureCreatedAsync();
        setupDb.Categories.Add(TestFactory.MakeCategory());
        setupDb.Products.Add(TestFactory.MakeProduct("p1", "cat1", 20m, stock: 5));
        await setupDb.SaveChangesAsync();

        var guestToken = Guid.NewGuid().ToString("N");
        await TestFactory.SeedCartAsync(setupDb, userId: null, guestToken, ("p1", 1));

        var checkoutDb = TestDb.CreateContext(connection);
        var checkoutController = new OrdersController(checkoutDb, new CartResolver(checkoutDb), new MockPaymentService())
        {
            ControllerContext = TestFactory.MakeControllerContext(TestFactory.GuestPrincipal(), guestToken),
        };
        var checkoutResult = await checkoutController.Checkout(new CreateOrderRequest(TestFactory.MakeShipping()));
        var order = Assert.IsType<OrderDto>(Assert.IsType<OkObjectResult>(checkoutResult.Result).Value);

        // First attempt: force a decline.
        var failDb = TestDb.CreateContext(connection);
        var failController = new OrdersController(failDb, new CartResolver(failDb), new MockPaymentService())
        {
            ControllerContext = TestFactory.MakeControllerContext(TestFactory.GuestPrincipal(), guestToken),
        };
        var failResult = await failController.ConfirmPayment(
            order.OrderNumber, order.Shipping.Email,
            new ConfirmPaymentRequest(TestFactory.MakeCard(), "Fail"));
        Assert.IsType<BadRequestObjectResult>(failResult.Result);

        var assertDb1 = TestDb.CreateContext(connection);
        var afterFailure = await assertDb1.Orders.Include(o => o.Payments).FirstAsync(o => o.OrderNumber == order.OrderNumber);
        Assert.Equal(OrderStatus.PendingPayment, afterFailure.Status);
        Assert.Equal(PaymentStatus.Failed, afterFailure.PaymentStatus);
        Assert.Single(afterFailure.Payments);

        var productAfterFailure = await assertDb1.Products.FirstAsync(p => p.Id == "p1");
        Assert.Equal(5, productAfterFailure.StockQuantity); // untouched

        // Retry: force success this time — should create a SECOND Payment row.
        var retryDb = TestDb.CreateContext(connection);
        var retryController = new OrdersController(retryDb, new CartResolver(retryDb), new MockPaymentService())
        {
            ControllerContext = TestFactory.MakeControllerContext(TestFactory.GuestPrincipal(), guestToken),
        };
        var retryResult = await retryController.ConfirmPayment(
            order.OrderNumber, order.Shipping.Email,
            new ConfirmPaymentRequest(TestFactory.MakeCard(), "Succeed"));
        var paid = Assert.IsType<OrderDto>(Assert.IsType<OkObjectResult>(retryResult.Result).Value);
        Assert.Equal("Paid", paid.PaymentStatus);

        var assertDb2 = TestDb.CreateContext(connection);
        var afterRetry = await assertDb2.Orders.Include(o => o.Payments).FirstAsync(o => o.OrderNumber == order.OrderNumber);
        Assert.Equal(2, afterRetry.Payments.Count);

        var productAfterRetry = await assertDb2.Products.FirstAsync(p => p.Id == "p1");
        Assert.Equal(4, productAfterRetry.StockQuantity); // decremented only once, by the successful attempt
    }
}
