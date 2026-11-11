using Smart_Routes.Application.BalanceCriterions.Queries.GetAllBalanceCriteria;
using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Models;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;

namespace Smart_Routes.Application.Routes.Commands.GetRouteByFilter;

[Authorize]
public record GetRouteByFilter : IRequest<IList<RouteDto>>
{
    public DateTimeOffset? ScheduleBefore { get; init; }
    public DateTimeOffset? ScheduleLast { get; init; }

    public int? Id { get; init; }
    public int? DistributionCenterId { get; init; }
    public int? BalanceCriterionId { get; init; }
    public string? DeliveryPersonId { get; init; }
    public string? LogisticCoordiantorId { get; init; }
    public string? SupervisorId { get; init; }
    public bool WithStops { get; init; } = true;
    public bool WithBalanceCriterion { get; init; } = true;
    public ReviewDecision? State{get;init;}
}


public class GetRouteByFilterHandler : IRequestHandler<GetRouteByFilter, IList<RouteDto>>
{
    private readonly IApplicationDbContext _context;

    public GetRouteByFilterHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IList<RouteDto>> Handle(GetRouteByFilter request, CancellationToken cancellationToken)
    {
        IQueryable<Route> query = _context.Routes.AsNoTracking();
        query.Include(r=>r.Reviews);

        if (request.Id.HasValue)
        {
            query = query.Where(r => r.Id == request.Id.Value);
        }

        if (request.DistributionCenterId.HasValue)
        {
            query = query.Where(r => r.DistributionCenterId == request.DistributionCenterId.Value);
        }

        if (request.BalanceCriterionId.HasValue)
        {
            query = query.Where(r => r.BalanceCriterionId == request.BalanceCriterionId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.DeliveryPersonId))
        {
            query = query.Where(r => r.DeliveryPersonId == request.DeliveryPersonId);
        }

        if (!string.IsNullOrWhiteSpace(request.LogisticCoordiantorId))
        {
            query = query.Where(r => r.GeneratorCoordinatorId == request.LogisticCoordiantorId);
        }

        if (request.ScheduleBefore.HasValue)
        {
            query = query.Where(r => r.ScheduledDate <= request.ScheduleBefore.Value);
        }

        if (request.ScheduleLast.HasValue)
        {
            query = query.Where(r => r.ScheduledDate >= request.ScheduleLast.Value);
        }

        if (request.WithStops)
        {
            query = query
                .Include(r => r.RouteOrders)
                    .ThenInclude(ro => ro.Order)
                    .ThenInclude(o => o.Stop)
                .Include(r => r.RouteStops)
                    .ThenInclude(rs => rs.Stop);
        }

        if (request.WithBalanceCriterion)
        {
            query = query
                .Include(r => r.BalanceCriterion)
                    .ThenInclude(bc => bc.Parameters);
        }
        if (request.State!=null)
        {
            query = request.State == ReviewDecision.Pending
                ? query.Where(r=>r.Reviews.Count==0)
                : query.Where(r=>r.Reviews.Any(rev=>rev.Decision==request.State));


        }
        if (!String.IsNullOrWhiteSpace(request.SupervisorId))
        {
            query.Where(r => r.Reviews.Any(rev=>rev.SupervisorId==request.SupervisorId));


        }

        var routes = await query
            .OrderBy(r => r.ScheduledDate)
            .ToListAsync(cancellationToken);

        var result = new List<RouteDto>();

        foreach (var route in routes)
        {
            var routeDto = new RouteDto
            {
                Id = route.Id,
                ScheduledDate = route.ScheduledDate,
                GeneratorCoordinatorId = route.GeneratorCoordinatorId,
                DistributionCenterId = route.DistributionCenterId,
                DeliveryPersonId = route.DeliveryPersonId,
                BalanceCriterionId = route.BalanceCriterionId,
                OrdersOrdered = [],
                Created=route.Created,
            };

            if (request.WithStops)
            {
                var orderedStops = route.RouteStops
                    .OrderBy(rs => rs.VisitOrder)
                    .Select(rs => rs.Stop)
                    .ToList();

                var orderedOrders = new List<Order>();

                foreach (var stop in orderedStops)
                {
                    var ordersForStop = route.RouteOrders
                        .Where(ro => ro.Order.StopId == stop.Id)
                        .Select(ro => ro.Order)
                        .ToList();

                    orderedOrders.AddRange(ordersForStop);
                }

                routeDto.OrdersOrdered = orderedOrders;
            }

            if (request.WithBalanceCriterion && route.BalanceCriterion is not null)
            {
                routeDto.BalanceCriterion = new BalanceCriterionWithParametersDto
                {
                    Id = route.BalanceCriterion.Id,
                    Name = route.BalanceCriterion.Name,
                    Description = route.BalanceCriterion.Description,
                    AuthorCoordinatorId = route.BalanceCriterion.AuthorCoordinatorId,
                    IsPredefined = route.BalanceCriterion.IsPredefined,
                    Parameters = route.BalanceCriterion.Parameters
                        .OrderBy(p => p.Id)
                        .Select(p => new BalanceParameterDto
                        {
                            Id = p.Id,
                            Name = p.Name,
                            Metric = p.Metric,
                            Operator = p.Operator,
                            AppliedValue = p.AppliedValue,
                            TargetDeliveryType = p.TargetDeliveryType,
                            BalanceCriterionId = p.BalanceCriterionId
                        })
                        .ToList()
                };
            }

            result.Add(routeDto);
        }

        return result;
    }
}