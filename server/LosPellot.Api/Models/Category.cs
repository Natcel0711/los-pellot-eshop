namespace LosPellot.Api.Models;

public class Category
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string IconName { get; set; } = string.Empty;
    public string DefaultBulbType { get; set; } = "Universal";

    // Preserves the curated display order from the original site's
    // CATEGORIES array (not alphabetical — headlights first, etc.).
    public int SortOrder { get; set; }

    public List<Product> Products { get; set; } = [];
}
