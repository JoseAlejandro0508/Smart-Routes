namespace Smart_Routes.Domain.Entities;

/// <summary>
/// RUTA_PEDIDO (N:M relationship CONTIENE_PEDIDO). Composite PK (id_ruta, id_pedido).
/// </summary>
/// <remarks>
/// Implements the ITEM_RUTA aggregation ("an order within a specific route"): delivery records
/// and rescheduling requests hang from it, so each route keeps its own history for the order.
/// </remarks>
public class RouteOrder
{
    public int RouteId { get; set; }

    public Route Route { get; set; } = null!;

    public int OrderId { get; set; }

    public Order Order { get; set; } = null!;

    /// <summary>REGISTRA: delivery attempt of the order in this route (0..1).</summary>
    public DeliveryRecord? DeliveryRecord { get; set; }

    /// <summary>AFECTA: rescheduling request of the order in this route (0..1).</summary>
    public Rescheduling? Rescheduling { get; set; }
}
