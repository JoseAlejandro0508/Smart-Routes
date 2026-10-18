namespace Smart_Routes.Domain.Entities;

/// <summary>
/// PARADA. Punto físico donde el vehículo se detiene para entregar uno o varios pedidos.
/// </summary>
public class Stop : BaseAuditableEntity
{
    /// <summary>direccion.</summary>
    public string Address { get; set; } = string.Empty;

    /// <summary>LOCALIZADA_EN: zona en la que se ubica la parada.</summary>
    public int ZoneId { get; set; }

    public Zone Zone { get; set; } = null!;

    /// <summary>ENTREGA_EN: pedidos consolidados en esta parada.</summary>
    public IList<Order> Orders { get; private set; } = new List<Order>();

    /// <summary>RECORRE_PARADA: rutas que pasan por esta parada.</summary>
    public IList<RouteStop> RouteStops { get; private set; } = new List<RouteStop>();
}
