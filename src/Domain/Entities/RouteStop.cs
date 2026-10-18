namespace Smart_Routes.Domain.Entities;

/// <summary>
/// RUTA_PARADA (interrelación N:M RECORRE_PARADA). PK compuesta (id_ruta, id_parada).
/// </summary>
public class RouteStop
{
    public int RouteId { get; set; }

    public Route Route { get; set; } = null!;

    public int StopId { get; set; }

    public Stop Stop { get; set; } = null!;

    /// <summary>orden_visita: no se repite dentro de una misma ruta.</summary>
    public int VisitOrder { get; set; }
}
