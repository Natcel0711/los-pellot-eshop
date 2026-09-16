using LosPellot.Api.Controllers;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using LosPellot.Api.Services;
using LosPellot.Api.Services.Payments;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Tests;

public class CheckoutSuccessTests
{
    [Fact]
    public async Task Checkout_WithValidCartAndSuccessfulPayment_DecrementsStockClearsCartAndMarksOrderPaid()
    {
        using var connection = TestDb.OpenSharedConnection(Guid.NewGuid().ToString("N"));

        var setupDb = TestDb.CreateContext(connection);
        await setupDb.Database.EnsureCreatedAsync();
        setupDb.Categories.Add(TestFactory.MakeCategory());
        setupDb.Products.Add(TestFactory.MakeProduct("p1", "cat1", 50m, stock: 10));
        await setupDb.SaveChangesAsync();

        var guestToken = Guid.NewGuid().ToString("N");
        var cart = await TestFactory.SeedCartAsync(setupDb, userId: null, guestToken, ("p1", 3));

        // A fresh DbContext per call below mirrors production, where each
        // HTTP request gets its own scoped DbContext — this matters because
        // ExecuteUpdateAsync bypasses the change tracker, so reusing one
        // DbContext across phases would read back a stale tracked Product
        // instead of what's actually in the database.
        var checkoutDb = TestDb.CreateContext(connection);
        var checkoutController = new OrdersController(checkoutDb, new CartResolver(checkoutDb), new MockPaymentService())
        {
            ControllerContext = TestFactory.MakeControllerContext(TestFactory.GuestPrincipal(), guestToken),
        };
        var checkoutResult = await checkoutController.Checkout(new CreateOrderRequest(TestFactory.MakeShipping()));
        var order = Assert.IsType<OrderDto>(Assert.IsType<OkObjectResult>(checkoutResult.Result).Value);
        Assert.Equal("PendingPayment", order.Status);
        Assert.Equal(150m, order.Subtotal); // 50 * 3, server-computed

        var payDb = TestDb.CreateContext(connection);
        var payController = new OrdersController(payDb, new CartResolver(payDb), new MockPaymentService())
        {
            ControllerContext = TestFactory.MakeControllerContext(TestFactory.GuestPrincipal(), guestToken),
        };
        var payResult = await payController.ConfirmPayment(
            order.OrderNumber, order.Shipping.Email,
            new ConfirmPaymentRequest(TestFactory.MakeCard(), null));
        var paid = Assert.IsType<OrderDto>(Assert.IsType<OkObjectResult>(payResult.Result).Value);

        Assert.Equal("Received", paid.Status);
        Assert.Equal("Paid", paid.PaymentStatus);

        var assertDb = TestDb.CreateContext(connection);
        var product = await assertDb.Products.FirstAsync(p => p.Id == "p1");
        Assert.Equal(7, product.StockQuantity); // 10 - 3

        var remainingCartItems = await assertDb.CartItems.CountAsync(i => i.CartHeaderId == cart.Id);
        Assert.Equal(0, remainingCartItems);
    }
}
