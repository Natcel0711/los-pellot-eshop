using LosPellot.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductFitment> ProductFitments => Set<ProductFitment>();
    public DbSet<VehicleYear> VehicleYears => Set<VehicleYear>();
    public DbSet<VehicleMake> VehicleMakes => Set<VehicleMake>();
    public DbSet<VehicleModel> VehicleModels => Set<VehicleModel>();
    public DbSet<VehicleTrim> VehicleTrims => Set<VehicleTrim>();
    public DbSet<CartHeader> CartHeaders => Set<CartHeader>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<ShippingLabel> ShippingLabels => Set<ShippingLabel>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Product>()
            .Property(p => p.Price).HasColumnType("decimal(10,2)");
        builder.Entity<Product>()
            .Property(p => p.SalePrice).HasColumnType("decimal(10,2)");
        builder.Entity<Product>()
            .HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ProductFitment>()
            .HasOne(f => f.Product)
            .WithMany(p => p.Fitments)
            .HasForeignKey(f => f.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<VehicleModel>()
            .HasOne(m => m.Year)
            .WithMany(y => y.Models)
            .HasForeignKey(m => m.YearId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<VehicleModel>()
            .HasOne(m => m.Make)
            .WithMany(mk => mk.Models)
            .HasForeignKey(m => m.MakeId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<VehicleTrim>()
            .HasOne(t => t.Model)
            .WithMany(m => m.Trims)
            .HasForeignKey(t => t.ModelId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<CartItem>()
            .HasOne(i => i.CartHeader)
            .WithMany(h => h.Items)
            .HasForeignKey(i => i.CartHeaderId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<CartItem>()
            .Property(i => i.Qty).HasDefaultValue(1);

        builder.Entity<Order>()
            .HasIndex(o => o.OrderNumber).IsUnique();
        builder.Entity<Order>()
            .HasIndex(o => o.IdempotencyKey).IsUnique();
        builder.Entity<Order>()
            .Property(o => o.Subtotal).HasColumnType("decimal(10,2)");
        builder.Entity<Order>()
            .Property(o => o.ShippingCost).HasColumnType("decimal(10,2)");
        builder.Entity<Order>()
            .Property(o => o.Discount).HasColumnType("decimal(10,2)");
        builder.Entity<Order>()
            .Property(o => o.Tax).HasColumnType("decimal(10,2)");
        builder.Entity<OrderItem>()
            .HasOne(i => i.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<OrderItem>()
            .Property(i => i.UnitPriceSnapshot).HasColumnType("decimal(10,2)");

        builder.Entity<Payment>()
            .HasOne(p => p.Order)
            .WithMany(o => o.Payments)
            .HasForeignKey(p => p.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<Payment>()
            .Property(p => p.Amount).HasColumnType("decimal(10,2)");
        builder.Entity<Payment>()
            .HasIndex(p => p.IdempotencyKey).IsUnique();

        builder.Entity<ShippingLabel>()
            .HasOne(s => s.Order)
            .WithMany(o => o.ShippingLabels)
            .HasForeignKey(s => s.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ShippingLabel>()
            .Property(s => s.Amount).HasColumnType("decimal(10,2)");
        builder.Entity<ShippingLabel>()
            .Property(s => s.WeightLb).HasColumnType("decimal(10,2)");
        builder.Entity<ShippingLabel>()
            .Property(s => s.LengthIn).HasColumnType("decimal(10,2)");
        builder.Entity<ShippingLabel>()
            .Property(s => s.WidthIn).HasColumnType("decimal(10,2)");
        builder.Entity<ShippingLabel>()
            .Property(s => s.HeightIn).HasColumnType("decimal(10,2)");
    }
}
