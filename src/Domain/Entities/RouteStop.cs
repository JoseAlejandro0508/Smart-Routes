namespace Smart_Routes.Domain.Entities;

/// <summary>
/// RUTA_PARADA (N:M relationship RECORRE_PARADA). Composite PK (id_ruta, id_parada).
/// </summary>
public class RouteStop
{
    public int RouteId { get; set; }

    public Route Route { get; set; } = null!;

    public int StopId { get; set; }

    public Stop Stop { get; set; } = null!;

    /// <summary>orden_visita: unique within a single route.</summary>
    public int VisitOrder { get; set; }
}
