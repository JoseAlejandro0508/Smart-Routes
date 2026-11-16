using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;
using Smart_Routes.Domain.Routing;

namespace Smart_Routes.Application.Routes.Queries.GetRouteMap;

/// <summary>Map data of a route: center, stops in visiting order and the road path between them.</summary>
/// <param name="RouteId">Route to draw.</param>
[Authorize]
public record GetRouteMapQuery(int RouteId) : IRequest<RouteMapDto>;

/// <summary>Everything the front-end needs to draw a route on the map.</summary>
public sealed record RouteMapDto
{
    /// <summary>Route identifier.</summary>
    public int RouteId { get; init; }

    /// <summary>Scheduled day of the route.</summary>
    public DateTimeOffset ScheduledDate { get; init; }

    /// <summary>Distribution center the route departs from.</summary>
    public RouteMapCenterDto Center { get; init; } = null!;

    /// <summary>Stops in visiting order.</summary>
    public IReadOnlyList<RouteMapStopDto> Stops { get; init; } = [];

    /// <summary>Path along the roads, or null when fewer than two points are located.</summary>
    public RouteMapPathDto? Path { get; init; }
}

/// <summary>Center of the route on the map.</summary>
/// <param name="Id">Center identifier.</param>
/// <param name="Name">Center name.</param>
/// <param name="Latitude">Latitude, or null if the center is not located.</param>
/// <param name="Longitude">Longitude, or null if the center is not located.</param>
public sealed record RouteMapCenterDto(int Id, string Name, double? Latitude, double? Longitude);

/// <summary>A stop of the route.</summary>
/// <param name="VisitOrder">Position in the itinerary, starting at 1.</param>
/// <param name="StopId">Stop identifier.</param>
/// <param name="Address">Stop address.</param>
/// <param name="ZoneId">Zone of the stop.</param>
/// <param name="Latitude">Latitude, or null if the stop could not be located.</param>
/// <param name="Longitude">Longitude, or null if the stop could not be located.</param>
/// <param name="Orders">Orders delivered at this stop.</param>
public sealed record RouteMapStopDto(
    int VisitOrder,
    int StopId,
    string Address,
    int ZoneId,
    double? Latitude,
    double? Longitude,
    IReadOnlyList<RouteMapOrderDto> Orders);

/// <summary>An order delivered at a stop.</summary>
/// <param name="Id">Order identifier.</param>
/// <param name="Description">Order description.</param>
/// <param name="Priority">Order priority.</param>
/// <param name="DeliveryType">Delivery type.</param>
/// <param name="WeightKg">Weight in kg.</param>
/// <param name="DeadlineAt">Delivery deadline.</param>
/// <param name="Status">Current order status.</param>
public sealed record RouteMapOrderDto(
    int Id,
    string Description,
    OrderPriority Priority,
    DeliveryType DeliveryType,
    decimal WeightKg,
    DateTimeOffset DeadlineAt,
    OrderStatus Status);

/// <summary>Path along the roads.</summary>
/// <param name="LatLngs">Points of the line as [latitude, longitude] pairs, ready for a Leaflet polyline.</param>
/// <param name="DistanceMeters">Total length in meters.</param>
/// <param name="DurationSeconds">Total travel time in seconds.</param>
/// <param name="Source"><c>osrm</c> if it follows real roads, <c>estimated</c> if it is a straight-line estimate.</param>
public sealed record RouteMapPathDto(
    IReadOnlyList<double[]> LatLngs,
    double DistanceMeters,
    double DurationSeconds,
    string Source);

/// <summary>Builds the map data of a route.</summary>
public class GetRouteMapQueryHandler : IRequestHandler<GetRouteMapQuery, RouteMapDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IRoadNetworkService _roadNetwork;

    /// <summary>Creates the handler.</summary>
    public GetRouteMapQueryHandler(IApplicationDbContext context, IRoadNetworkService roadNetwork)
    {
        _context = context;
        _roadNetwork = roadNetwork;
    }

    /// <inheritdoc />
    public async Task<RouteMapDto> Handle(GetRouteMapQuery request, CancellationToken cancellationToken)
    {
        var route = await _context.Routes
            .AsNoTracking()
            .Include(r => r.DistributionCenter)
            .Include(r => r.RouteStops).ThenInclude(rs => rs.Stop)
            .Include(r => r.RouteOrders).ThenInclude(ro => ro.Order)
            .FirstOrDefaultAsync(r => r.Id == request.RouteId, cancellationToken)
            ?? throw new NotFoundException(request.RouteId.ToString(), nameof(Route));

        var ordersByStop = route.RouteOrders
            .Select(ro => ro.Order)
            .GroupBy(o => o.StopId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(o => o.Priority).ThenBy(o => o.DeadlineAt).ToList());

        var stops = route.RouteStops
            .OrderBy(rs => rs.VisitOrder)
            .Select(rs => new RouteMapStopDto(
                rs.VisitOrder,
                rs.StopId,
                rs.Stop.Address,
                rs.Stop.ZoneId,
                rs.Stop.Y,
                rs.Stop.X,
                ordersByStop.GetValueOrDefault(rs.StopId, [])
                    .Select(o => new RouteMapOrderDto(o.Id, o.Description, o.Priority, o.DeliveryType, o.WeightKg, o.DeadlineAt, o.Status))
                    .ToList()))
            .ToList();

        var center = route.DistributionCenter;
        var depot = GeoPoint.From(center.X, center.Y);

        var points = new List<GeoPoint>();
        if (depot is not null)
        {
            points.Add(depot.Value);
        }

        points.AddRange(route.RouteStops
            .OrderBy(rs => rs.VisitOrder)
            .Select(rs => GeoPoint.From(rs.Stop.X, rs.Stop.Y))
            .Where(p => p is not null)
            .Select(p => p!.Value));

        if (depot is not null)
        {
            points.Add(depot.Value);
        }

        RouteMapPathDto? path = null;
        if (points.Count >= 2)
        {
            var roadPath = await _roadNetwork.GetPathAsync(points, cancellationToken);
            path = new RouteMapPathDto(
                roadPath.Geometry.Select(p => new[] { p.Latitude, p.Longitude }).ToList(),
                roadPath.DistanceMeters,
                roadPath.DurationSeconds,
                roadPath.Source);
        }

        return new RouteMapDto
        {
            RouteId = route.Id,
            ScheduledDate = route.ScheduledDate,
            Center = new RouteMapCenterDto(center.Id, center.Name, center.Y, center.X),
            Stops = stops,
            Path = path
        };
    }
}
