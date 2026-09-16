using LosPellot.Api.Controllers;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using LosPellot.Api.Services;
using LosPellot.Api.Services.Payments;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Tests;

public class ConcurrentPurchaseTests
{
    [Fact]
    public async Task ConfirmPayment_TwoOrdersForLastUnit_OnlyOneSucceedsAndStockNeverGoesNegative()
    {
        var dbName = Guid.NewGuid().ToString("N");
        using var keeper = TestDb.OpenSharedConnection(dbName); // keeps the shared in-memory DB alive

        var setupDb = TestDb.CreateContext(keeper);
        await setupDb.Database.EnsureCreatedAsync();
        setupDb.Categories.Add(TestFactory.MakeCategory());
        setupDb.Products.Add(TestFactory.MakeProduct("p1", "cat1", 30m, stock: 1)); // exactly one unit left
        await setupDb.SaveChangesAsync();

        // Two independent guests, each buying the last unit, both reach
        // PendingPayment fine (Phase A only soft-checks, doesn't reserve).
        var tokenA = Guid.NewGuid().ToString("N");
        var tokenB = Guid.NewGuid().ToString("N");
        await TestFactory.SeedCartAsync(setupDb, userId: null, tokenA, ("p1", 1));
        await TestFactory.SeedCartAsync(setupDb, userId: null, tokenB, ("p1", 1));

        var controllerA = new OrdersController(setupDb, new CartResolver(setupDb), new MockPaymentService())
        {
            ControllerContext = TestFactory.MakeControllerContext(TestFactory.GuestPrincipal(), tokenA),
        };
        var controllerB = new OrdersController(setupDb, new CartResolver(setupDb), new MockPaymentService())
        {
            ControllerContext = TestFactory.MakeControllerContext(TestFactory.GuestPrincipal(), tokenB),
        };

        var orderA = Assert.IsType<OrderDto>(Assert.IsType<OkObjectResult>(
            (await controllerA.Checkout(new CreateOrderRequest(TestFactory.MakeShipping("a@example.com")))).Result).Value);
        var orderB = Assert.IsType<OrderDto>(Assert.IsType<OkObjectResult>(
            (await controllerB.Checkout(new CreateOrderRequest(TestFactory.MakeShipping("b@example.com")))).Result).Value);

        // Now confirm both payments truly concurrently, each against its own
        // connection/DbContext pointing at the same shared-cache database —
        // this is what actually exercises the atomic stock-decrement guard.
        using var connectionA = TestDb.OpenSharedConnection(dbName);
        using var connectionB = TestDb.OpenSharedConnection(dbName);
        var dbA = TestDb.CreateContext(connectionA);
        var dbB = TestDb.CreateContext(connectionB);

        var payControllerA = new OrdersController(dbA, new CartResolver(dbA), new MockPaymentService())
        {
            ControllerContext = TestFactory.MakeControllerContext(TestFactory.GuestPrincipal(), tokenA),
        };
        var payControllerB = new OrdersController(dbB, new CartResolver(dbB), new MockPaymentService())
        {
            ControllerContext = TestFactory.MakeControllerContext(TestFactory.GuestPrincipal(), tokenB),
        };

        var taskA = payControllerA.ConfirmPayment(orderA.OrderNumber, "a@example.com", new ConfirmPaymentRequest(TestFactory.MakeCard(), "Succeed"));
        var taskB = payControllerB.ConfirmPayment(orderB.OrderNumber, "b@example.com", new ConfirmPaymentRequest(TestFactory.MakeCard(), "Succeed"));
        var results = await Task.WhenAll(taskA, taskB);

        var outcomes = results.Select(r => r.Result).ToArray();
        var succeeded = outcomes.Count(r => r is OkObjectResult ok && ((OrderDto)ok.Value!).PaymentStatus == "Paid");
        var conflicted = outcomes.Count(r => r is ObjectResult { StatusCode: StatusCodes.Status409Conflict });

        Assert.Equal(1, succeeded);
        Assert.Equal(1, conflicted);

        var finalStock = (await TestDb.CreateContext(keeper).Products.FirstAsync(p => p.Id == "p1")).StockQuantity;
        Assert.Equal(0, finalStock); // never negative, exactly one unit consumed
    }
}
