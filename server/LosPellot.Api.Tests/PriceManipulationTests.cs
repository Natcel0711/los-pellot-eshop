using LosPellot.Api.Controllers;
using LosPellot.Api.DTOs;
using LosPellot.Api.Services;
using LosPellot.Api.Services.Payments;
using Microsoft.AspNetCore.Mvc;

namespace LosPellot.Api.Tests;

// CreateOrderRequest/ConfirmPaymentRequest never carry a price at all — the
// client can only send product IDs and quantities. These tests document and
// verify that invariant: no matter what a compromised or buggy client sent,
// the server-computed total is always ProductPrice(DB) * Qty.
public class PriceManipulationTests
{
    [Fact]
    public async Task Checkout_ComputesTotalFromDatabasePrice_RegardlessOfClientInput()
    {
        using var connection = TestDb.OpenSharedConnection(Guid.NewGuid().ToString("N"));
        var db = TestDb.CreateContext(connection);
        await db.Database.EnsureCreatedAsync();

        db.Categories.Add(TestFactory.MakeCategory());
        db.Products.Add(TestFactory.MakeProduct("p1", "cat1", price: 99.99m, stock: 10));
        await db.SaveChangesAsync();

        var guestToken = Guid.NewGuid().ToString("N");
        await TestFactory.SeedCartAsync(db, userId: null, guestToken, ("p1", 2));

        var controller = new OrdersController(db, new CartResolver(db), new MockPaymentService())
        {
            ControllerContext = TestFactory.MakeControllerContext(TestFactory.GuestPrincipal(), guestToken),
        };

        // The request shape has no price field to tamper with — Shipping
        // only. This proves the DTO surface itself blocks the attack.
        var result = await controller.Checkout(new CreateOrderRequest(TestFactory.MakeShipping()));
        var order = Assert.IsType<OrderDto>(Assert.IsType<OkObjectResult>(result.Result).Value);

        Assert.Equal(199.98m, order.Subtotal); // 99.99 * 2, straight from the DB row
        Assert.Single(order.Items);
        Assert.Equal(99.99m, order.Items[0].UnitPrice);
    }
}
