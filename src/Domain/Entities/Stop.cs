namespace Smart_Routes.Domain.Entities;

/// <summary>
/// PARADA. Physical location where the vehicle stops to deliver one or more orders.
/// </summary>
public class Stop : BaseAuditableEntity
{
    /// <summary>Address (direccion).</summary>
    public string Address { get; set; } = string.Empty;

    /// <summary>LOCALIZADA_EN: zone where the stop is located.</summary>
    public int ZoneId { get; set; }

    public Zone Zone { get; set; } = null!;

    /// <summary>ENTREGA_EN: orders consolidated at this stop.</summary>
    public IList<Order> Orders { get; private set; } = new List<Order>();

    /// <summary>RECORRE_PARADA: routes that pass through this stop.</summary>
    public IList<RouteStop> RouteStops { get; private set; } = new List<RouteStop>();
}
