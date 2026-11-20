using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;

namespace Smart_Routes.Application.DistributionCenters.Queries.GetAll;

[Authorize]
public record GetAllQuery : IRequest<IEnumerable<DistributionCenterReducedDto>>;

public class GetAllQueryHandler : IRequestHandler<GetAllQuery, IEnumerable<DistributionCenterReducedDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAllQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<DistributionCenterReducedDto>> Handle(GetAllQuery request, CancellationToken cancellationToken)
    {
        return await _context.DistributionCenters
            .AsNoTracking()
            .OrderBy(center => center.Name)
            .Select(center => new DistributionCenterReducedDto
            {
                Id = center.Id,
                Name = center.Name,
                LogisticsProgram = center.LogisticsProgram,
                Latitude = center.Y,
                Longitude = center.X,
                CoveredZoneIds = center.CoveredZones.Select(zone => zone.ZoneId).ToList()
            })
            .ToListAsync(cancellationToken);
    }
}
