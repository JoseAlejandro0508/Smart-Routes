namespace Smart_Routes.Domain.Entities;

/// <summary>
/// RUTA. Itinerario de reparto planificado para una jornada.
/// </summary>
public class Route : BaseAuditableEntity
{
    /// <summary>fecha_creacion.</summary>
    public DateTimeOffset CreationDate { get; set; }

    /// <summary>fecha_programada (jornada de reparto).</summary>
    public DateOnly ScheduledDate { get; set; }

    /// <summary>capacidad_vehiculo.</summary>
    public decimal VehicleCapacity { get; set; }

    /// <summary>estado_ruta.</summary>
    public RouteStatus Status { get; set; } = RouteStatus.PendingApproval;

    /// <summary>fecha_validacion (posterior a fecha_creacion).</summary>
    public DateTimeOffset? ValidationDate { get; set; }

    /// <summary>GENERA: coordinador que disparó la generación.</summary>
    public string CoordinatorId { get; set; } = string.Empty;

    public LogisticsCoordinator Coordinator { get; set; } = null!;

    /// <summary>ORIGINADA_EN: centro desde el que parte el vehículo.</summary>
    public int DistributionCenterId { get; set; }

    public DistributionCenter DistributionCenter { get; set; } = null!;

    /// <summary>REVISA_Y_APRUEBA: supervisor que valida (nullable hasta la revisión).</summary>
    public string? SupervisorId { get; set; }

    public OperationsSupervisor? Supervisor { get; set; }

    /// <summary>EJECUTA: repartidor que la conduce (nullable hasta la asignación).</summary>
    public string? DeliveryPersonId { get; set; }

    public DeliveryPerson? DeliveryPerson { get; set; }

    /// <summary>CONTIENE_PEDIDO: manifiesto de carga.</summary>
    public IList<Order> Orders { get; private set; } = new List<Order>();

    /// <summary>RECORRE_PARADA: itinerario ordenado de paradas.</summary>
    public IList<RouteStop> RouteStops { get; private set; } = new List<RouteStop>();

    /// <summary>APLICA_CRITERIO: criterios aplicados con su configuración congelada.</summary>
    public IList<RouteCriterion> RouteCriteria { get; private set; } = new List<RouteCriterion>();
}
