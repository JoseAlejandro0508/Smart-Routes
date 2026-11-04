using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;


namespace Smart_Routes.Application.DistributionCenters.Commands.AddCoveredZone;
[Authorize(Roles = Roles.Administrator)]
public record AddCoveredZoneCommand : IRequest
{
    public int DistributionCenterId { get; set; }
    public int ZoneId { get; set; }
}
public class AddCoveredZoneCommandHandler:IRequestHandler<AddCoveredZoneCommand>
{
    private readonly IApplicationDbContext _context;

    public AddCoveredZoneCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(AddCoveredZoneCommand request, CancellationToken cancellationToken)
    {
        var distributionCenter = await _context.DistributionCenters
            .Include(dc => dc.CoveredZones)
            .FirstOrDefaultAsync(dc => dc.Id == request.DistributionCenterId, cancellationToken);

        if (distributionCenter == null)
        {
            throw new NotFoundException(nameof(DistributionCenter), request.DistributionCenterId.ToString());
        }

        var zone = await _context.Zones.FindAsync(new object[] { request.ZoneId }, cancellationToken);
        if (zone == null)
        {
            throw new NotFoundException(nameof(Zone), request.ZoneId.ToString());
        }
        var isAsociatedZone=distributionCenter.CoveredZones.Any(cz => cz.ZoneId == request.ZoneId);
        if (isAsociatedZone)
        {
            throw new ValidationException("Zone is already associated with the Distribution Center");
        }

        var centerZone = new CenterZone
        {
            DistributionCenterId = distributionCenter.Id,
            ZoneId = zone.Id
        };

        distributionCenter.CoveredZones.Add(centerZone);

        await _context.SaveChangesAsync(cancellationToken);
    }
}