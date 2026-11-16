using FluentValidation.Results;
using Microsoft.Extensions.Logging;
using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;
using Smart_Routes.Domain.Routing;
using AppValidationException = Smart_Routes.Application.Common.Exceptions.ValidationException;

namespace Smart_Routes.Application.Routes.Services;

/// <summary>
/// Fills a route with orders and stops automatically (RF-07, RF-11).
/// </summary>
/// <remarks>
/// <list type="number">
/// <item>Takes the pending orders of the route's center whose stop is in a zone the center covers
/// and whose deadline is not before the scheduled day.</item>
/// <item>Chooses the orders with <see cref="RouteOrderSelector"/>, which applies the balance criterion.</item>
/// <item>Locates the stops on the map (geocoding the address when a stop has no coordinates).</item>
/// <item>Asks the road network for the distance between every pair of points and orders the stops
/// with <see cref="StopSequencer"/>, starting and ending at the center.</item>
/// <item>Saves the orders (<see cref="RouteOrder"/>) and the itinerary (<see cref="RouteStop"/>).</item>
/// </list>
/// </remarks>
public sealed class RouteGenerator : IRouteGenerator
{
    private readonly IApplicationDbContext _context;
    private readonly RouteOrderSelector _selector;
    private readonly IRoadNetworkService _roadNetwork;
    private readonly IGeocodingService _geocoding;
    private readonly ILogger<RouteGenerator> _logger;

    /// <summary>Creates the generator.</summary>
    public RouteGenerator(
        IApplicationDbContext context,
        RouteOrderSelector selector,
        IRoadNetworkService roadNetwork,
        IGeocodingService geocoding,
        ILogger<RouteGenerator> logger)
    {
        _context = context;
        _selector = selector;
        _roadNetwork = roadNetwork;
        _geocoding = geocoding;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task GenerateAsync(int RouteId, CancellationToken cancellationToken)
    {
        var route = await _context.Routes
            .Include(r => r.DistributionCenter)
            .Include(r => r.BalanceCriterion).ThenInclude(c => c.Parameters)
            .Include(r => r.RouteOrders)
            .FirstOrDefaultAsync(r => r.Id == RouteId, cancellationToken)
            ?? throw new NotFoundException(RouteId.ToString(), nameof(Route));

        if (route.RouteOrders.Count > 0)
        {
            // Already generated: generating again would duplicate orders.
            return;
        }

        var candidates = await LoadCandidatesAsync(route, cancellationToken);
        var selection = _selector.Select(candidates, route.BalanceCriterion.Parameters.ToList());

        if (selection.Selected.Count == 0)
        {
            _context.Routes.Remove(route);
            await _context.SaveChangesAsync(cancellationToken);

            throw new AppValidationException(new[]
            {
                new ValidationFailure(
                    "Orders",
                    "No hay pedidos pendientes en el centro que cumplan el criterio de equilibrio para esa fecha.")
            });
        }

        var stopIds = selection.Selected.Select(c => c.StopId).Distinct().ToList();
        var stops = await _context.Stops
            .Where(s => stopIds.Contains(s.Id))
            .ToListAsync(cancellationToken);

        await LocateStopsAsync(stops, cancellationToken);

        var visitOrder = await SequenceStopsAsync(route.DistributionCenter, stops, selection.Selected, cancellationToken);

        var selectedIds = selection.Selected.Select(c => c.OrderId).ToHashSet();
        var orders = await _context.Orders
            .Where(o => selectedIds.Contains(o.Id))
            .ToListAsync(cancellationToken);

        foreach (var order in orders)
        {
            order.Status = OrderStatus.InRoute;
            route.RouteOrders.Add(new RouteOrder { RouteId = route.Id, OrderId = order.Id });
        }

        for (var position = 0; position < visitOrder.Count; position++)
        {
            route.RouteStops.Add(new RouteStop
            {
                RouteId = route.Id,
                StopId = visitOrder[position].Id,
                VisitOrder = position + 1
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        foreach (var evaluation in selection.Evaluations.Where(e => !e.IsSatisfied))
        {
            _logger.LogInformation(
                "Route {RouteId}: parameter {Metric} {Operator} {Applied} not satisfied (actual {Actual}).",
                route.Id, evaluation.Metric, evaluation.Operator, evaluation.AppliedValue, evaluation.ActualValue);
        }
    }

    /// <inheritdoc />
    public async Task RegenerateAsync(int ReviewId, CancellationToken cancellationToken)
    {
        var review = await _context.Reviews
            .Include(r => r.Route).ThenInclude(r => r.RouteOrders).ThenInclude(ro => ro.Order)
            .Include(r => r.Route).ThenInclude(r => r.RouteOrders).ThenInclude(ro => ro.DeliveryRecord)
            .FirstOrDefaultAsync(r => r.Id == ReviewId, cancellationToken)
            ?? throw new NotFoundException(ReviewId.ToString(), nameof(Review));

        if (review.BalanceCriterioId is null ||
            await _context.Routes.AnyAsync(r => r.OriginReviewId == ReviewId, cancellationToken))
        {
            return;
        }

        var previous = review.Route;

        // The orders of the reviewed route go back to the pool so the new route can take them.
        foreach (var item in previous.RouteOrders.Where(ro => ro.DeliveryRecord is null))
        {
            item.Order.Status = OrderStatus.Pending;
        }

        var reconfigured = new Route
        {
            ScheduledDate = previous.ScheduledDate,
            GeneratorCoordinatorId = previous.GeneratorCoordinatorId,
            DistributionCenterId = previous.DistributionCenterId,
            DeliveryPersonId = previous.DeliveryPersonId,
            BalanceCriterionId = review.BalanceCriterioId.Value,
            OriginReviewId = review.Id
        };

        _context.Routes.Add(reconfigured);
        await _context.SaveChangesAsync(cancellationToken);

        await GenerateAsync(reconfigured.Id, cancellationToken);
    }

    private async Task<List<RouteCandidate>> LoadCandidatesAsync(Route route, CancellationToken cancellationToken)
    {
        var coveredZoneIds = await _context.CenterZones
            .Where(cz => cz.DistributionCenterId == route.DistributionCenterId)
            .Select(cz => cz.ZoneId)
            .ToListAsync(cancellationToken);

        var scheduledDayStart = new DateTimeOffset(route.ScheduledDate.Date, route.ScheduledDate.Offset);

        return await _context.Orders
            .Where(o => o.DistributionCenterId == route.DistributionCenterId &&
                        o.Status == OrderStatus.Pending &&
                        o.DeadlineAt >= scheduledDayStart &&
                        coveredZoneIds.Contains(o.Stop.ZoneId))
            .Select(o => new RouteCandidate(
                o.Id,
                o.StopId,
                o.Stop.ZoneId,
                o.WeightKg,
                o.DeliveryType,
                o.Priority,
                o.DeadlineAt))
            .ToListAsync(cancellationToken);
    }

    private async Task LocateStopsAsync(IEnumerable<Stop> stops, CancellationToken cancellationToken)
    {
        foreach (var stop in stops.Where(s => s.X is null || s.Y is null))
        {
            var point = await _geocoding.GeocodeAsync(stop.Address, cancellationToken);
            if (point is null)
            {
                _logger.LogWarning("Stop {StopId} ({Address}) could not be located on the map.", stop.Id, stop.Address);
                continue;
            }

            stop.X = point.Value.Longitude;
            stop.Y = point.Value.Latitude;
        }
    }

    private async Task<List<Stop>> SequenceStopsAsync(
        DistributionCenter center,
        IReadOnlyCollection<Stop> stops,
        IReadOnlyCollection<RouteCandidate> selected,
        CancellationToken cancellationToken)
    {
        var located = stops.Where(s => s.X is not null && s.Y is not null).ToList();

        // Stops that could not be located go at the end, most urgent first.
        var unlocated = stops
            .Except(located)
            .OrderByDescending(s => selected.Where(c => c.StopId == s.Id).Max(c => c.Priority))
            .ThenBy(s => s.Id)
            .ToList();

        if (located.Count == 0)
        {
            return unlocated;
        }

        var depot = GeoPoint.From(center.X, center.Y);
        var startsAtDepot = depot is not null;

        // Without coordinates for the center, the route starts at the stop of the most urgent order.
        if (!startsAtDepot)
        {
            var first = located
                .OrderByDescending(s => selected.Where(c => c.StopId == s.Id).Max(c => c.Priority))
                .ThenBy(s => selected.Where(c => c.StopId == s.Id).Min(c => c.DeadlineAt))
                .First();
            located.Remove(first);
            located.Insert(0, first);
        }

        var points = new List<GeoPoint>();
        if (startsAtDepot)
        {
            points.Add(depot!.Value);
        }

        points.AddRange(located.Select(s => new GeoPoint(s.X!.Value, s.Y!.Value)));

        var matrix = await _roadNetwork.GetMatrixAsync(points, cancellationToken);
        var order = StopSequencer.Sequence(matrix.DistancesMeters, returnToStart: startsAtDepot);

        var sequenced = new List<Stop>();
        if (startsAtDepot)
        {
            sequenced.AddRange(order.Select(index => located[index - 1]));
        }
        else
        {
            sequenced.Add(located[0]);
            sequenced.AddRange(order.Select(index => located[index]));
        }

        sequenced.AddRange(unlocated);
        return sequenced;
    }
}
