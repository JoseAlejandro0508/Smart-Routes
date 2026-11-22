namespace Smart_Routes.Application.DistributionCenters.Queries.GetAll;

/// <summary>Resumen de un centro de distribución para listados administrativos.</summary>
public class DistributionCenterReducedDto
{
    public int Id { get; init; }
    public string? Name { get; init; }
    public string? LogisticsProgram { get; init; }

    /// <summary>Latitud del centro, si está ubicado en el mapa.</summary>
    public double? Latitude { get; init; }

    /// <summary>Longitud del centro, si está ubicado en el mapa.</summary>
    public double? Longitude { get; init; }

    /// <summary>Zonas cubiertas por el centro.</summary>
    public IList<int> CoveredZoneIds { get; init; } = new List<int>();
}
