using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.Stops.Commands.CreateStop;

[Authorize(Roles = $"{Roles.LogisticsCoordinator},{Roles.Administrator}")]
public record CreateStopCommand : IRequest
{
    public required string Address { get; init; }
    public int ZoneId { get; init; }

    /// <summary>Optional latitude (for example, a point picked on the map). If missing, the address is geocoded.</summary>
    public double? Latitude { get; init; }

    /// <summary>Optional longitude (for example, a point picked on the map). If missing, the address is geocoded.</summary>
    public double? Longitude { get; init; }
}

public class CreateStopCommandHandler : IRequestHandler<CreateStopCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly IGeocodingService _geocoding;

    public CreateStopCommandHandler(IApplicationDbContext context, IGeocodingService geocoding)
    {
        _context = context;
        _geocoding = geocoding;
    }

    public async Task Handle(CreateStopCommand request, CancellationToken cancellationToken)
    {
        var zoneExists = await _context.Zones.AnyAsync(z => z.Id == request.ZoneId, cancellationToken);
        if (!zoneExists)
        {
            throw new NotFoundException(nameof(Zone), request.ZoneId.ToString());
        }

        var stopExists = await _context.Stops
            .AnyAsync(s => s.ZoneId == request.ZoneId && s.Address == request.Address, cancellationToken);

        if (stopExists)
        {
            throw new ValidationException("A stop with this address already exists in the zone.");
        }

        var address = request.Address.Trim();

        // Coordinates picked on the map win; otherwise the address is located with the geocoding service.
        var point = request.Latitude is not null && request.Longitude is not null
            ? new Smart_Routes.Domain.Routing.GeoPoint(request.Longitude.Value, request.Latitude.Value)
            : await _geocoding.GeocodeAsync(address, cancellationToken);

        var entity = new Stop
        {
            Address = address,
            ZoneId = request.ZoneId,
            X = point?.Longitude,
            Y = point?.Latitude
        };

        _context.Stops.Add(entity);

        await _context.SaveChangesAsync(cancellationToken);
    }
}
