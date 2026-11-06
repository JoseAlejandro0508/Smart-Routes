namespace Smart_Routes.Domain.Entities;

/// <summary>
/// RUTA. Delivery itinerary planned for a working day.
/// </summary>
/// <remarks>
/// The route status and validation date are not stored: they are derived from its latest
/// <see cref="Review"/> (see <see cref="RouteStatus"/>).
/// </remarks>
public class RouteStatus 
{

    public required string Id { get; set; }

    public IList<RouteOrderStatus> RouteOrders { get; private set; } = new List<RouteOrderStatus>();


}
