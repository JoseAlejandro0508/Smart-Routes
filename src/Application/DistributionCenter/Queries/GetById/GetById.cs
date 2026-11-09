using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;



namespace Smart_Routes.Application.DistributionCenters.Queries.GetById;
[Authorize]
public record GetByIdQuery(int DCid) : IRequest<DistributionCenterExtendedDto>;

public class GetByIdQueryHandler : IRequestHandler<GetByIdQuery, DistributionCenterExtendedDto>
{
    private readonly IApplicationDbContext _context;

    public GetByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;

    }

    public async Task<DistributionCenterExtendedDto> Handle(GetByIdQuery request, CancellationToken cancellationToken)
    {
        var distributionCenter = await _context.DistributionCenters.AsNoTracking()
        .Include(dc => dc.AssignedDeliveryPersons)
        .Include(dc => dc.AuthorizedCoordinators)
        .Include(dc => dc.CoveredZones)
        .Include(dc => dc.Orders)
        .Include(dc => dc.Routes)
        .FirstOrDefaultAsync(dc => dc.Id == request.DCid, cancellationToken: cancellationToken);
        if (distributionCenter == null)
        {
            throw new NotFoundException(nameof(DistributionCenter), request.DCid.ToString());
        }
        var deliveryPersonsId = distributionCenter.AssignedDeliveryPersons.Select(dp => dp.DeliveryPersonId).ToList();
        var coordinatorsId = distributionCenter.AuthorizedCoordinators.Select(ac => ac.CoordinatorId).ToList();
        var coveredZonesId = distributionCenter.CoveredZones.Select(cz => cz.ZoneId).ToList();
        var ordersId = distributionCenter.Orders.Select(o => o.Id).ToList().ToList();
        var routesId = distributionCenter.Routes.Select(r => r.Id).ToList().ToList();

        return new DistributionCenterExtendedDto
        {
            Id = distributionCenter.Id,
            Name = distributionCenter.Name,
            AssignedDeliveryPersons = deliveryPersonsId,
            AuthorizedCoordinators = coordinatorsId,
            CoveredZones = coveredZonesId,
            Orders = ordersId,
            Routes = routesId
        };

    }
}