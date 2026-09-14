namespace LosPellot.Api.DTOs;

public record CategoryDto(string Id, string Name, string Icon, string DefaultBulbType);

public record ProductDto(
    string Id,
    string Name,
    string Category,
    decimal Price,
    decimal? SalePrice,
    string Lumens,
    string Warranty,
    string? Badge,
    bool Universal,
    bool? FitsSelectedVehicle,
    string? ImageUrl
);

public record VehicleModelTreeDto(string Model, List<string> Trims);

public record VehicleMakeTreeDto(string Make, List<VehicleModelTreeDto> Models);

public record VehicleYearTreeDto(int Year, List<VehicleMakeTreeDto> Makes);
