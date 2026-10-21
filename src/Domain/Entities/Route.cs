namespace Smart_Routes.Domain.Entities;

/// <summary>
/// RUTA. Delivery itinerary planned for a working day.
/// </summary>
/// <remarks>
/// The route status and validation date are not stored: they are derived from its latest
/// <see cref="Review"/> (see <see cref="RouteStatus"/>).
/// </remarks>
public class Route : BaseAuditableEntity
{
    /// <summary>Creation date (fecha_creacion).</summary>
    public DateTimeOffset CreationDate { get; set; }

    /// <summary>Scheduled delivery day (fecha_programada), not earlier than the creation date.</summary>
    public DateOnly ScheduledDate { get; set; }

    /// <summary>Vehicle capacity in kg (capacidad_vehiculo_kg), greater than zero.</summary>
    public decimal VehicleCapacityKg { get; set; }

    /// <summary>GENERA: coordinator who generated the route (id_coord_generador).</summary>
    public string GeneratorCoordinatorId { get; set; } = string.Empty;

    public LogisticsCoordinator GeneratorCoordinator { get; set; } = null!;

    /// <summary>ORIGINADA_EN: center the route departs from (id_centro_ruta).</summary>
    public int DistributionCenterId { get; set; }

    public DistributionCenter DistributionCenter { get; set; } = null!;

    /// <summary>EJECUTA: delivery person assigned once the route is approved (null until then).</summary>
    public string? DeliveryPersonId { get; set; }

    public DeliveryPerson? DeliveryPerson { get; set; }

    /// <summary>RECONFECCIONA: rejected review this route was built from (id_revision_origen); null for regular routes.</summary>
    public int? OriginReviewId { get; set; }

    public Review? OriginReview { get; set; }

    /// <summary>CONTIENE_PEDIDO: orders carried by the route (ITEM_RUTA).</summary>
    public IList<RouteOrder> RouteOrders { get; private set; } = new List<RouteOrder>();

    /// <summary>RECORRE_PARADA: ordered itinerary of stops.</summary>
    public IList<RouteStop> RouteStops { get; private set; } = new List<RouteStop>();

    /// <summary>APLICA_PARAMETRO: parameter values applied when generating the route (frozen configuration).</summary>
    public IList<RouteParameter> RouteParameters { get; private set; } = new List<RouteParameter>();

    /// <summary>EVALUA: review history of the route.</summary>
    public IList<Review> Reviews { get; private set; } = new List<Review>();
}
