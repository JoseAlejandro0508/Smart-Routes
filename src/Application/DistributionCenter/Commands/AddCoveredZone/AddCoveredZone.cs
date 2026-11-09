using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;


namespace Smart_Routes.Application.DistributionCenters.Commands.AddCoveredZone;

[Authorize(Roles = Roles.Administrator)]
public record AddCoveredZoneCommand : IRequest
{
    public int DistributionCenterId { get; set; }
    public required IList<int> ZoneIds { get; set; }
}
public class AddCoveredZoneCommandHandler : IRequestHandler<AddCoveredZoneCommand>
{
    private readonly IApplicationDbContext _context;

    public AddCoveredZoneCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(AddCoveredZoneCommand request, CancellationToken cancellationToken)
    {
        var distributionCenter = await _context.DistributionCenters
            .AsNoTracking()
            .Include(dc => dc.CoveredZones)
            .FirstOrDefaultAsync(dc => dc.Id == request.DistributionCenterId, cancellationToken);

        if (distributionCenter == null)
        {
            throw new NotFoundException(nameof(DistributionCenter), request.DistributionCenterId.ToString());
        }

        foreach (var zoneId in request.ZoneIds)
        {
            var zone = await _context.Zones.AnyAsync(z => z.Id == zoneId, cancellationToken);
            if (!zone)
            {
                throw new NotFoundException(nameof(Zone), zoneId.ToString());
            }
            var isAsociatedZone = distributionCenter.CoveredZones.Any(cz => cz.ZoneId == zoneId);
            if (isAsociatedZone)
            {
                throw new ValidationException($"Zone {zoneId} is already associated with the Distribution Center");
            }

            var centerZone = new CenterZone
            {
                DistributionCenterId = distributionCenter.Id,
                ZoneId = zoneId
            };

            _context.CenterZones.Add(centerZone);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}