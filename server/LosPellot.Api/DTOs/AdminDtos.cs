namespace LosPellot.Api.DTOs;

// ---- Products ----
public record AdminProductDto(
    string Id, string Name, string CategoryId, decimal Price, decimal? SalePrice,
    string Lumens, string Warranty, string? Badge, bool IsUniversal, int StockQuantity,
    string? ImageUrl
);

public record UpsertProductRequest(
    string Id, string Name, string CategoryId, decimal Price, decimal? SalePrice,
    string Lumens, string Warranty, string? Badge, bool IsUniversal, int StockQuantity
);

public record UpdateStockRequest(int StockQuantity);

// ---- Categories ----
public record AdminCategoryDto(string Id, string Name, string IconName, string DefaultBulbType, int SortOrder);

public record UpsertCategoryRequest(string Id, string Name, string IconName, string DefaultBulbType, int SortOrder);

// ---- Vehicles ----
public record AdminYearDto(int Id, int Year);
public record CreateYearRequest(int Year);

public record AdminMakeDto(int Id, string Name);
public record CreateMakeRequest(string Name);

public record AdminModelDto(int Id, int YearId, int Year, int MakeId, string MakeName, string Name);
public record CreateModelRequest(int YearId, int MakeId, string Name);

public record AdminTrimDto(int Id, int ModelId, string Name);
public record CreateTrimRequest(int ModelId, string Name);

// ---- Users ----
public record AdminUserDto(string Id, string FullName, string Email, DateTime CreatedAt, bool IsAdmin);
public record UpdateUserAdminRequest(bool IsAdmin);

// ---- Orders ----
public record AdminOrderDto(
    string OrderNumber, string Status, string PaymentStatus, string CustomerName, string CustomerEmail,
    bool IsGuest, decimal Subtotal, decimal ShippingCost, decimal Discount, decimal Tax, decimal Total,
    int ItemCount, DateTime CreatedAt
);
public record UpdateOrderStatusRequest(string Status);

// Full detail for one order — used by the shipping-label view, which needs
// the full address and item list that the list endpoint's flatter
// AdminOrderDto doesn't carry.
public record AdminOrderDetailDto(
    string OrderNumber, string Status, string PaymentStatus, string CustomerName, string CustomerEmail,
    bool IsGuest, ShippingInfo Shipping, List<OrderItemDto> Items,
    decimal Subtotal, decimal ShippingCost, decimal Discount, decimal Tax, decimal Total, DateTime CreatedAt,
    List<ShippingLabelDto> ShippingLabels
);

// ---- Real carrier shipping labels (Shippo) ----
public record PackageRequest(decimal WeightLb, decimal LengthIn, decimal WidthIn, decimal HeightIn);

public record ShippingRateDto(string RateId, string Carrier, string ServiceLevel, decimal Amount, string Currency, string? EstimatedDays);

public record GetShippingRatesRequest(PackageRequest Package);

public record PurchaseShippingLabelRequest(ShippingRateDto Rate, PackageRequest Package);

public record ShippingLabelDto(
    string Provider, string LabelUrl, string TrackingNumber, string? TrackingUrlProvider,
    string Carrier, string ServiceLevel, decimal Amount, string Currency, DateTime CreatedAt
);

// ---- Bookings ----
public record AdminBookingDto(
    int Id, string Name, string Phone, string Email, string VehicleDescription,
    string ServiceType, DateOnly PreferredDate, string? Notes, string Status, DateTime CreatedAt
);
public record UpdateBookingStatusRequest(string Status);

// ---- Contact messages ----
public record AdminContactMessageDto(
    int Id, string Name, string Email, string? Phone, string Subject, string Message,
    DateTime CreatedAt, DateTime? HandledAt
);

// ---- Dashboard ----
public record AdminDashboardDto(
    int ProductCount, int LowStockCount, int CategoryCount, int UserCount,
    int OrderCount, int PendingBookingCount, int UnhandledContactCount
);
