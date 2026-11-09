using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.DistributionCenters.Commands.RemoveCoveredZone;

[Authorize(Roles = Roles.Administrator)]
public record RemoveCoveredZonesCommand : IRequest
{
    public int DistributionCenterId { get; set; }
    public required IList<int> ZoneIds { get; set; }
}

public class RemoveCoveredZonesCommandHandler : IRequestHandler<RemoveCoveredZonesCommand>
{
    private readonly IApplicationDbContext _context;

    public RemoveCoveredZonesCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(RemoveCoveredZonesCommand request, CancellationToken cancellationToken)
    {
        var distributionCenter = await _context.DistributionCenters
            .Include(dc => dc.CoveredZones)
            .FirstOrDefaultAsync(dc => dc.Id == request.DistributionCenterId, cancellationToken);

        if (distributionCenter == null)
        {
            throw new NotFoundException(nameof(DistributionCenter), request.DistributionCenterId.ToString());
        }

        foreach (var zoneId in request.ZoneIds.Distinct())
        {
            if (zoneId <= 0)
            {
                throw new ValidationException("Zone ids must be greater than zero.");
            }

            var zoneExists = await _context.Zones.AnyAsync(z => z.Id == zoneId, cancellationToken);
            if (!zoneExists)
            {
                throw new NotFoundException(nameof(Zone), zoneId.ToString());
            }

            var centerZone = distributionCenter.CoveredZones
                .FirstOrDefault(cz => cz.ZoneId == zoneId);

            if (centerZone == null)
            {
                throw new ValidationException($"Zone {zoneId} is not associated with the Distribution Center");
            }

            _context.CenterZones.Remove(centerZone);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
