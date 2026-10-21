namespace Smart_Routes.Domain.Entities;

/// <summary>
/// REPROGRAMACION. Virtual request to reschedule the delivery of an order within a route,
/// and its manual resolution by a coordinator.
/// </summary>
/// <remarks>
/// It does not require a failed delivery record: the request can be made in advance.
/// The requesting delivery person is the one who drives the route, so it is not stored.
/// </remarks>
public class Rescheduling : BaseAuditableEntity
{
    /// <summary>Request date (fecha_solicitud).</summary>
    public DateTimeOffset RequestDate { get; set; }

    /// <summary>Reason (motivo).</summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>Request status (estado_solicitud).</summary>
    public ReschedulingStatus Status { get; set; } = ReschedulingStatus.Pending;

    /// <summary>Manual result (resultado_manual); not null if and only if the request is resolved.</summary>
    public ManualResolution? ManualResult { get; set; }

    /// <summary>Resolution date (fecha_resolucion); not null if and only if resolved, and later than the request date.</summary>
    public DateTimeOffset? ResolutionDate { get; set; }

    /// <summary>AFECTA: (id_ruta, id_pedido) of the order-in-route; unique, so at most one request per order-in-route.</summary>
    public int RouteId { get; set; }

    public int OrderId { get; set; }

    public RouteOrder RouteOrder { get; set; } = null!;

    /// <summary>RESUELVE: coordinator chosen to resolve the request (id_coord_resolutor).</summary>
    public string ResolverCoordinatorId { get; set; } = string.Empty;

    public LogisticsCoordinator ResolverCoordinator { get; set; } = null!;
}
