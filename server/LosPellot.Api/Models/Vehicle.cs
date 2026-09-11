namespace LosPellot.Api.Models;

public class VehicleYear
{
    public int Id { get; set; }
    public int Year { get; set; }

    public List<VehicleModel> Models { get; set; } = [];
}

public class VehicleMake
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public List<VehicleModel> Models { get; set; } = [];
}

// A (Year, Make, Model) triple — the same model name can recur under
// different years/makes with a different trim list each time, mirroring the
// original VEHICLES[year][make][model] nesting.
public class VehicleModel
{
    public int Id { get; set; }
    public int YearId { get; set; }
    public VehicleYear? Year { get; set; }
    public int MakeId { get; set; }
    public VehicleMake? Make { get; set; }
    public string Name { get; set; } = string.Empty;

    public List<VehicleTrim> Trims { get; set; } = [];
}

public class VehicleTrim
{
    public int Id { get; set; }
    public int ModelId { get; set; }
    public VehicleModel? Model { get; set; }
    public string Name { get; set; } = string.Empty;
}
