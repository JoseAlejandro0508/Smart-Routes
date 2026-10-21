namespace Smart_Routes.Domain.Entities;

/// <summary>
/// REGISTRO_ENTREGA. Record of the attempt to deliver an order within a specific route.
/// </summary>
public class DeliveryRecord : BaseAuditableEntity
{
    /// <summary>Delivery date and time (fecha_hora_entrega).</summary>
    public DateTimeOffset DeliveredAt { get; set; }

    /// <summary>Delivery result (resultado).</summary>
    public DeliveryResult Result { get; set; }

    /// <summary>Observations (observaciones_entrega).</summary>
    public string? Observations { get; set; }

    /// <summary>REGISTRA: (id_ruta, id_pedido) of the order-in-route; unique, so at most one record per order-in-route.</summary>
    public int RouteId { get; set; }

    public int OrderId { get; set; }

    public RouteOrder RouteOrder { get; set; } = null!;
}
