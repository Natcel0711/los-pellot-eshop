namespace LosPellot.Api.Models;

// A row acts as a wildcard on any null column: Year/Make/Model all null means
// "fits every vehicle" (today's `universal: true` products); Make set with
// Year/Model null means "fits every year/model of that make", etc.
public class ProductFitment
{
    public int Id { get; set; }
    public string ProductId { get; set; } = string.Empty;
    public Product? Product { get; set; }
    public int? Year { get; set; }
    public string? Make { get; set; }
    public string? Model { get; set; }
}
