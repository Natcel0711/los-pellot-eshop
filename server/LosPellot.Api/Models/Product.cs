namespace LosPellot.Api.Models;

public class Product
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public Category? Category { get; set; }
    public decimal Price { get; set; }
    public decimal? SalePrice { get; set; }
    public string Lumens { get; set; } = string.Empty;
    public string Warranty { get; set; } = string.Empty;
    public string? Badge { get; set; }
    public bool IsUniversal { get; set; }

    public List<ProductFitment> Fitments { get; set; } = [];
}
