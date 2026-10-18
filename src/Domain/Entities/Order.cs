namespace Smart_Routes.Domain.Entities;

/// <summary>
/// PEDIDO. Unidad de transporte que ingresa un coordinador y luego se asigna a una ruta.
/// </summary>
/// <remarks>
/// La zona del pedido (DESTINADO_A) no se almacena: se deduce a través de <see cref="Stop"/>
/// porque f18 es una dependencia transitiva (3FN).
/// </remarks>
public class Order : BaseAuditableEntity
{
    /// <summary>descripcion.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>tipo_entrega.</summary>
    public DeliveryType DeliveryType { get; set; }

    /// <summary>prioridad.</summary>
    public OrderPriority Priority { get; set; }

    /// <summary>fecha_ingreso.</summary>
    public DateTimeOffset EntryDate { get; set; }

    /// <summary>estado_pedido.</summary>
    public OrderStatus Status { get; set; } = OrderStatus.Registered;

    /// <summary>INGRESA: coordinador que dio de alta el pedido.</summary>
    public string CoordinatorId { get; set; } = string.Empty;

    public LogisticsCoordinator Coordinator { get; set; } = null!;

    /// <summary>RADICADO_EN: centro que custodia el pedido.</summary>
    public int DistributionCenterId { get; set; }

    public DistributionCenter DistributionCenter { get; set; } = null!;

    /// <summary>ENTREGA_EN: parada de destino.</summary>
    public int StopId { get; set; }

    public Stop Stop { get; set; } = null!;

    /// <summary>CONTIENE_PEDIDO: ruta que lo transporta (nullable hasta asignarse).</summary>
    public int? RouteId { get; set; }

    public Route? Route { get; set; }

    /// <summary>ORIGINA: registro de la entrega del pedido (0..1).</summary>
    public DeliveryRecord? DeliveryRecord { get; set; }
}
