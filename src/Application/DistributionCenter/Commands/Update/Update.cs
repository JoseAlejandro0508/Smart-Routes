using Smart_Routes.Application.Common.Exceptions;
using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.DistributionCenters.Commands.Update;

/// <summary>Actualiza los datos básicos y la cobertura de un centro de distribución.</summary>
[Authorize(Roles = Roles.Administrator)]
public class UpdateDistributionCenterCommand : IRequest
{
    public int Id { get; init; }
    public required string Name { get; init; }
    public required string LogisticProgram { get; init; }
    public double? Latitude { get; init; }
    public double? Longitude { get; init; }

    /// <summary>Zonas que debe cubrir el centro después de la actualización.</summary>
    public IList<int> CoveredZoneIds { get; init; } = new List<int>();
}

public class UpdateDistributionCenterCommandHandler : IRequestHandler<UpdateDistributionCenterCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateDistributionCenterCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateDistributionCenterCommand request, CancellationToken cancellationToken)
    {
        if ((request.Latitude is null) != (request.Longitude is null))
        {
            throw new FluentValidation.ValidationException("Latitude and Longitude must be sent together.");
        }

        var center = await _context.DistributionCenters
            .Include(entity => entity.CoveredZones)
            .FirstOrDefaultAsync(entity => entity.Id == request.Id, cancellationToken);

        if (center is null)
        {
            throw new NotFoundException(nameof(DistributionCenter), request.Id.ToString());
        }

        if (await _context.DistributionCenters.AnyAsync(
                entity => entity.Id != request.Id && entity.Name == request.Name,
                cancellationToken))
        {
            throw new ConflictException("Ya existe un centro de distribución con ese nombre.");
        }

        var desiredZones = request.CoveredZoneIds.Distinct().ToList();
        var existingZoneIds = await _context.Zones
            .Where(zone => desiredZones.Contains(zone.Id))
            .Select(zone => zone.Id)
            .ToListAsync(cancellationToken);

        var missingZones = desiredZones.Except(existingZoneIds).ToList();
        if (missingZones.Count > 0)
        {
            throw new NotFoundException(nameof(Zone), string.Join(", ", missingZones));
        }

        center.Name = request.Name;
        center.LogisticsProgram = request.LogisticProgram;
        center.Y = request.Latitude;
        center.X = request.Longitude;

        foreach (var link in center.CoveredZones.Where(link => !desiredZones.Contains(link.ZoneId)).ToList())
        {
            _context.CenterZones.Remove(link);
        }

        foreach (var zoneId in desiredZones.Where(id => center.CoveredZones.All(link => link.ZoneId != id)))
        {
            _context.CenterZones.Add(new CenterZone
            {
                DistributionCenterId = center.Id,
                ZoneId = zoneId
            });
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
