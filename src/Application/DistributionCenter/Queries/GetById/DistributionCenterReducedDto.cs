namespace Smart_Routes.Application.DistributionCenters.Queries.GetById;

/// <summary>Detalle completo de un centro de distribución y sus vínculos.</summary>
public class DistributionCenterExtendedDto
{
    public int Id { get; init; }
    public string? Name { get; init; }
    public string? LogisticsProgram { get; init; }

    /// <summary>Latitud del centro, si está ubicado en el mapa.</summary>
    public double? Latitude { get; init; }

    /// <summary>Longitud del centro, si está ubicado en el mapa.</summary>
    public double? Longitude { get; init; }

    public IList<int>? CoveredZones { get; set; }
    public IList<string>? AuthorizedCoordinators { get; set; }
    public IList<string>? AssignedDeliveryPersons { get; set; }
    public IList<int>? Orders { get; set; }
    public IList<int>? Routes { get; set; }
}
