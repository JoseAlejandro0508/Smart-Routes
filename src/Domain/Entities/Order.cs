namespace Smart_Routes.Domain.Entities;

/// <summary>
/// PEDIDO. Shipping unit entered by a coordinator and classified by delivery type and priority.
/// </summary>
/// <remarks>
/// The order's zone is not stored: it is derived through <see cref="Stop"/> (ENTREGA_EN + LOCALIZADA_EN).
/// An order can appear in several routes (CONTIENE_PEDIDO is N:M), e.g. after a failed delivery is rescheduled.
/// </remarks>
public class Order : BaseAuditableEntity
{
    /// <summary>Description (descripcion).</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>Delivery type (tipo_entrega).</summary>
    public DeliveryType DeliveryType { get; set; }

    /// <summary>Priority (prioridad).</summary>
    public OrderPriority Priority { get; set; }

    /// <summary>Weight in kg (peso_kg), greater than zero.</summary>
    public decimal WeightKg { get; set; }

    /// <summary>Entry day (fecha_ingreso). A date without time, because it is part of the duplicate-prevention key.</summary>
    public DateOnly EntryDate { get; set; }

    /// <summary>Delivery deadline (fecha_hora_limite), not earlier than the entry day.</summary>
    public DateTimeOffset DeadlineAt { get; set; }

    /// <summary>Order status (estado_pedido).</summary>
    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    /// <summary>INGRESA: coordinator who entered the order (id_coord_ingreso).</summary>
    public string EntryCoordinatorId { get; set; } = string.Empty;

    public LogisticsCoordinator EntryCoordinator { get; set; } = null!;

    /// <summary>RADICADO_EN: center that holds the order (id_centro_pedido).</summary>
    public int DistributionCenterId { get; set; }

    public DistributionCenter DistributionCenter { get; set; } = null!;

    /// <summary>ENTREGA_EN: destination stop.</summary>
    public int StopId { get; set; }

    public Stop Stop { get; set; } = null!;

    /// <summary>CONTIENE_PEDIDO: routes that carry this order.</summary>
    public IList<RouteOrder> RouteOrders { get; private set; } = new List<RouteOrder>();
}
