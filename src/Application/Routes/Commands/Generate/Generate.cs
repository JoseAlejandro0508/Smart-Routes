using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.Routes.Commands.Generate;
[Authorize(Roles = $"{Roles.LogisticsCoordinator}")]
public record GenerateCommand:IRequest<List<Order>>
{
    public required DateTimeOffset ScheduledDate { get; init; }

    public required string DeliveryPersonId { get; init; }
    public required int DistributionCenterId { get; init; }
    public required int BalanceCriterionId { get; init; }
}
public class GenerateCommandHandler:IRequestHandler<GenerateCommand,List<Order>>
{

    private readonly IApplicationDbContext _context;
    private readonly IRouteGenerator _routeGenerator;
    public readonly IUser _currentUser;

    public GenerateCommandHandler(IApplicationDbContext context, IRouteGenerator routeGenerator,IUser currentUser)
    {
        _context = context;
        _routeGenerator = routeGenerator;
        _currentUser = currentUser;
    }

    public async Task<List<Order>> Handle(GenerateCommand request, CancellationToken cancellationToken)
    {
        var route = new Route
        {
            ScheduledDate = request.ScheduledDate,
            GeneratorCoordinatorId=_currentUser.Id!,
            DeliveryPersonId = request.DeliveryPersonId,
            DistributionCenterId = request.DistributionCenterId,
            BalanceCriterionId = request.BalanceCriterionId
        };

        _context.Routes.Add(route);
        await _context.SaveChangesAsync(cancellationToken);
        await _routeGenerator.GenerateAsync(route.Id, cancellationToken);
        var UpdatedRoute= await _context.Routes.Include(r=>r.RouteOrders).ThenInclude(ro=>ro.Order).ThenInclude(o=>o.Stop)
            .Include(r=>r.BalanceCriterion).ThenInclude(bc=>bc.Parameters)
            .Include(r=>r.RouteStops).ThenInclude(rs=>rs.Stop)
            .FirstOrDefaultAsync(r=>r.Id==route.Id,cancellationToken);
        
        var Stops=UpdatedRoute!.RouteStops.OrderBy(r=>r.VisitOrder).Select(rs=>rs.Stop).ToList();
        var OrdersOrdered=new List<Order>();
        foreach (var stp in Stops)
        {
            var Orders=UpdatedRoute.RouteOrders.Where(ro=>ro.Order.StopId==stp.Id).Select(ro=>ro.Order).ToList();
            OrdersOrdered.AddRange(Orders);
        }
        return OrdersOrdered;   
    }
    
}