using LosPellot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Data;

// Transforms the original static site's js/data.js constants (CATEGORIES,
// VEHICLES, PRODUCTS, FITMENT) into seeded rows. Runs once at startup in
// development if the Categories table is empty.
public static class SeedData
{
    public static async Task EnsureSeededAsync(AppDbContext db)
    {
        if (await db.Categories.AnyAsync()) return;

        var categories = new List<Category>
        {
            new() { Id = "headlights", Name = "Faros Delanteros", IconName = "headlight", DefaultBulbType = "H11" },
            new() { Id = "fog-lights", Name = "Fog Lights", IconName = "foglight", DefaultBulbType = "H8" },
            new() { Id = "drl", Name = "DRL / Luces Diurnas", IconName = "drl", DefaultBulbType = "H16" },
            new() { Id = "turn-signals", Name = "Direccionales", IconName = "signal", DefaultBulbType = "7440" },
            new() { Id = "tail-lights", Name = "Luces Traseras", IconName = "taillight", DefaultBulbType = "7443" },
            new() { Id = "reverse", Name = "Luz de Reversa", IconName = "reverse", DefaultBulbType = "921" },
            new() { Id = "side-markers", Name = "Side Markers", IconName = "marker", DefaultBulbType = "168" },
            new() { Id = "license-plate", Name = "Luz de Placa", IconName = "plate", DefaultBulbType = "194" },
            new() { Id = "interior", Name = "Interior / Cabina", IconName = "cabin", DefaultBulbType = "31mm Festoon" },
            new() { Id = "underglow", Name = "Underglow", IconName = "underglow", DefaultBulbType = "Universal RGB" },
            new() { Id = "light-bars", Name = "Barras LED", IconName = "bar", DefaultBulbType = "Universal" },
            new() { Id = "controllers", Name = "Switches y Controladores", IconName = "controller", DefaultBulbType = "Universal" },
        };
        for (var i = 0; i < categories.Count; i++) categories[i].SortOrder = i;
        db.Categories.AddRange(categories);

        var products = new List<Product>
        {
            new() { Id = "p001", Name = "Mini Chip LED Headlight Kit", CategoryId = "headlights", Price = 65, SalePrice = null, Lumens = "60,000", Warranty = "6 months", Badge = "Best Seller", IsUniversal = false },
            new() { Id = "p002", Name = "360° LED Headlight Kit", CategoryId = "headlights", Price = 45, SalePrice = 35, Lumens = "40,000", Warranty = "3 months", Badge = "Sale", IsUniversal = false },
            new() { Id = "p003", Name = "Super Chip LED Headlight Kit", CategoryId = "headlights", Price = 85, SalePrice = null, Lumens = "100,000", Warranty = "1 year", Badge = null, IsUniversal = false },
            new() { Id = "p004", Name = "Kamaleon Dual-Color LED Kit", CategoryId = "headlights", Price = 100, SalePrice = null, Lumens = "70,000", Warranty = "1 year", Badge = "Dual Color", IsUniversal = false },
            new() { Id = "p005", Name = "Fog Light LED Pods", CategoryId = "fog-lights", Price = 55, SalePrice = 42, Lumens = "30,000", Warranty = "6 months", Badge = "Sale", IsUniversal = false },
            new() { Id = "p006", Name = "H8/H11 Fog Light Bulb Set", CategoryId = "fog-lights", Price = 38, SalePrice = null, Lumens = "24,000", Warranty = "6 months", Badge = null, IsUniversal = false },
            new() { Id = "p007", Name = "DRL Switchback Strip Kit", CategoryId = "drl", Price = 48, SalePrice = null, Lumens = "18,000", Warranty = "6 months", Badge = null, IsUniversal = false },
            new() { Id = "p008", Name = "H16 DRL LED Bulbs", CategoryId = "drl", Price = 32, SalePrice = null, Lumens = "16,000", Warranty = "3 months", Badge = null, IsUniversal = false },
            new() { Id = "p009", Name = "Amber Turn Signal LED Set", CategoryId = "turn-signals", Price = 22, SalePrice = null, Lumens = "6,000", Warranty = "3 months", Badge = null, IsUniversal = false },
            new() { Id = "p010", Name = "Switchback Turn Signal Kit", CategoryId = "turn-signals", Price = 34, SalePrice = 27, Lumens = "8,000", Warranty = "6 months", Badge = "Sale", IsUniversal = false },
            new() { Id = "p011", Name = "7443 Tail Light LED Bulbs", CategoryId = "tail-lights", Price = 28, SalePrice = null, Lumens = "9,000", Warranty = "6 months", Badge = null, IsUniversal = false },
            new() { Id = "p012", Name = "Sequential LED Tail Kit", CategoryId = "tail-lights", Price = 90, SalePrice = 72, Lumens = "15,000", Warranty = "1 year", Badge = "Sale", IsUniversal = false },
            new() { Id = "p013", Name = "921 Reverse Light Bulbs", CategoryId = "reverse", Price = 18, SalePrice = null, Lumens = "4,000", Warranty = "3 months", Badge = null, IsUniversal = false },
            new() { Id = "p014", Name = "168 Side Marker LED Set", CategoryId = "side-markers", Price = 16, SalePrice = null, Lumens = "2,000", Warranty = "3 months", Badge = null, IsUniversal = false },
            new() { Id = "p015", Name = "Smoked Side Marker LEDs", CategoryId = "side-markers", Price = 24, SalePrice = null, Lumens = "2,400", Warranty = "3 months", Badge = "New", IsUniversal = false },
            new() { Id = "p016", Name = "194 License Plate LED Bulbs", CategoryId = "license-plate", Price = 12, SalePrice = null, Lumens = "1,200", Warranty = "3 months", Badge = null, IsUniversal = true },
            new() { Id = "p017", Name = "31mm Festoon Interior Kit", CategoryId = "interior", Price = 20, SalePrice = null, Lumens = "3,000", Warranty = "6 months", Badge = null, IsUniversal = true },
            new() { Id = "p018", Name = "RGB Cabin Light Kit w/ App Control", CategoryId = "interior", Price = 58, SalePrice = 46, Lumens = "5,000", Warranty = "1 year", Badge = "Sale", IsUniversal = true },
            new() { Id = "p019", Name = "Footwell Ambient LED Kit", CategoryId = "interior", Price = 44, SalePrice = null, Lumens = "4,500", Warranty = "1 year", Badge = null, IsUniversal = true },
            new() { Id = "p020", Name = "RGB Underglow Kit — 4pc", CategoryId = "underglow", Price = 120, SalePrice = 96, Lumens = "20,000", Warranty = "1 year", Badge = "Sale", IsUniversal = true },
            new() { Id = "p021", Name = "Bluetooth Underglow Controller Kit", CategoryId = "underglow", Price = 145, SalePrice = null, Lumens = "24,000", Warranty = "1 year", Badge = "Best Seller", IsUniversal = true },
            new() { Id = "p022", Name = "20\" Curved LED Light Bar", CategoryId = "light-bars", Price = 110, SalePrice = null, Lumens = "40,000", Warranty = "1 year", Badge = null, IsUniversal = true },
            new() { Id = "p023", Name = "30\" Dual-Row Light Bar", CategoryId = "light-bars", Price = 160, SalePrice = 130, Lumens = "60,000", Warranty = "1 year", Badge = "Sale", IsUniversal = true },
            new() { Id = "p024", Name = "RF Wireless LED Controller", CategoryId = "controllers", Price = 25, SalePrice = null, Lumens = "—", Warranty = "6 months", Badge = null, IsUniversal = true },
            new() { Id = "p025", Name = "App-Controlled RGB Relay Box", CategoryId = "controllers", Price = 40, SalePrice = null, Lumens = "—", Warranty = "1 year", Badge = "New", IsUniversal = true },
        };
        db.Products.AddRange(products);

        // Every universal product fits every vehicle (a single all-null wildcard row).
        // Non-universal products have no real per-vehicle fitment data in the
        // source site (it only ever labelled results with the vehicle, never
        // filtered) — left fitment-less here, a content gap to fill later.
        foreach (var product in products.Where(p => p.IsUniversal))
        {
            db.ProductFitments.Add(new ProductFitment { ProductId = product.Id });
        }

        SeedVehicles(db);

        await db.SaveChangesAsync();
    }

    private static void SeedVehicles(AppDbContext db)
    {
        // year -> make -> model -> trims, mirroring js/data.js's VEHICLES object.
        var raw = new Dictionary<int, Dictionary<string, Dictionary<string, string[]>>>
        {
            [2024] = new()
            {
                ["Toyota"] = new() { ["RAV4"] = ["LE", "XLE", "TRD Off-Road", "Limited"], ["Camry"] = ["LE", "SE", "XSE"], ["Tacoma"] = ["SR", "TRD Sport", "Limited"] },
                ["Honda"] = new() { ["Civic"] = ["LX", "Sport", "Type R"], ["CR-V"] = ["LX", "EX-L", "Sport Touring"] },
                ["Ford"] = new() { ["Mustang"] = ["EcoBoost", "GT", "Dark Horse"], ["F-150"] = ["XL", "Lariat", "Raptor"] },
                ["Jeep"] = new() { ["Wrangler"] = ["Sport", "Sahara", "Rubicon"], ["Grand Cherokee"] = ["Laredo", "Limited"] },
                ["Chevrolet"] = new() { ["Silverado 1500"] = ["WT", "LT", "Trail Boss"], ["Camaro"] = ["LT1", "SS", "ZL1"] },
            },
            [2020] = new()
            {
                ["Toyota"] = new() { ["RAV4"] = ["LE", "XLE", "TRD Off-Road", "Limited"], ["Camry"] = ["LE", "SE", "XSE"], ["Corolla"] = ["L", "LE", "SE"] },
                ["Honda"] = new() { ["Civic"] = ["LX", "Sport", "Si"], ["Accord"] = ["LX", "Sport", "Touring"] },
                ["Ford"] = new() { ["Mustang"] = ["EcoBoost", "GT"], ["F-150"] = ["XL", "Lariat", "Raptor"] },
                ["Jeep"] = new() { ["Wrangler"] = ["Sport", "Sahara", "Rubicon"] },
                ["Chevrolet"] = new() { ["Silverado 1500"] = ["WT", "LT"], ["Camaro"] = ["LT1", "SS"] },
            },
            [2016] = new()
            {
                ["Toyota"] = new() { ["RAV4"] = ["LE", "XLE", "Limited"], ["Camry"] = ["LE", "SE"], ["Tacoma"] = ["SR", "TRD Sport"] },
                ["Honda"] = new() { ["Civic"] = ["LX", "EX"], ["CR-V"] = ["LX", "EX-L"] },
                ["Ford"] = new() { ["Mustang"] = ["V6", "EcoBoost", "GT"], ["F-150"] = ["XL", "Lariat"] },
                ["Jeep"] = new() { ["Wrangler"] = ["Sport", "Sahara", "Rubicon"] },
                ["Chevrolet"] = new() { ["Silverado 1500"] = ["WT", "LT"], ["Camaro"] = ["LT", "SS"] },
            },
            [2012] = new()
            {
                ["Toyota"] = new() { ["Camry"] = ["LE", "SE"], ["Corolla"] = ["L", "LE"] },
                ["Honda"] = new() { ["Civic"] = ["LX", "EX"], ["Accord"] = ["LX", "EX"] },
                ["Ford"] = new() { ["Mustang"] = ["V6", "GT"], ["F-150"] = ["XL", "Lariat"] },
                ["Jeep"] = new() { ["Wrangler"] = ["Sport", "Sahara"] },
                ["Chevrolet"] = new() { ["Camaro"] = ["LT", "SS"] },
            },
        };

        var makesByName = new Dictionary<string, VehicleMake>();

        foreach (var (year, makes) in raw)
        {
            var yearEntity = new VehicleYear { Year = year };
            db.VehicleYears.Add(yearEntity);

            foreach (var (makeName, models) in makes)
            {
                if (!makesByName.TryGetValue(makeName, out var makeEntity))
                {
                    makeEntity = new VehicleMake { Name = makeName };
                    makesByName[makeName] = makeEntity;
                    db.VehicleMakes.Add(makeEntity);
                }

                foreach (var (modelName, trims) in models)
                {
                    var modelEntity = new VehicleModel
                    {
                        Year = yearEntity,
                        Make = makeEntity,
                        Name = modelName,
                    };
                    db.VehicleModels.Add(modelEntity);

                    foreach (var trimName in trims)
                    {
                        db.VehicleTrims.Add(new VehicleTrim { Model = modelEntity, Name = trimName });
                    }
                }
            }
        }
    }
}
