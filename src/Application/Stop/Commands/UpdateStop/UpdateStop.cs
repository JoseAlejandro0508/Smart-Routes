using FluentValidation.Results;
using Smart_Routes.Application.Common.Exceptions;
using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Routing;
using AppValidationException = Smart_Routes.Application.Common.Exceptions.ValidationException;

namespace Smart_Routes.Application.Stops.Commands.UpdateStop;

/// <summary>Changes the address, zone or coordinates of a stop.</summary>
[Authorize(Roles = $"{Roles.LogisticsCoordinator},{Roles.Administrator}")]
public record UpdateStopCommand : IRequest
{
    /// <summary>Stop to change; taken from the URL.</summary>
    public int StopId { get; init; }

    /// <summary>New address.</summary>
    public required string Address { get; init; }

    /// <summary>New zone.</summary>
    public int ZoneId { get; init; }

    /// <summary>Optional latitude; with the longitude, it replaces the stop's position.</summary>
    public double? Latitude { get; init; }

    /// <summary>Optional longitude; with the latitude, it replaces the stop's position.</summary>
    public double? Longitude { get; init; }
}

/// <summary>Applies the change after checking the zone, duplicates and the orders already sent to the stop.</summary>
public class UpdateStopCommandHandler : IRequestHandler<UpdateStopCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly IGeocodingService _geocoding;

    /// <summary>Creates the handler.</summary>
    public UpdateStopCommandHandler(IApplicationDbContext context, IGeocodingService geocoding)
    {
        _context = context;
        _geocoding = geocoding;
    }

    /// <inheritdoc />
    public async Task Handle(UpdateStopCommand request, CancellationToken cancellationToken)
    {
        var stop = await _context.Stops
            .FirstOrDefaultAsync(s => s.Id == request.StopId, cancellationToken)
            ?? throw new NotFoundException(request.StopId.ToString(), nameof(Stop));

        if (!await _context.Zones.AnyAsync(z => z.Id == request.ZoneId, cancellationToken))
        {
            throw new NotFoundException(request.ZoneId.ToString(), nameof(Zone));
        }

        var address = request.Address.Trim();

        var duplicate = await _context.Stops.AnyAsync(
            s => s.Id != stop.Id && s.ZoneId == request.ZoneId && s.Address == address,
            cancellationToken);
        if (duplicate)
        {
            throw new ConflictException("A stop with this address already exists in the zone.");
        }

        if (request.ZoneId != stop.ZoneId)
        {
            await EnsureOrdersStillCoveredAsync(stop.Id, request.ZoneId, cancellationToken);
        }

        if (request.Latitude is not null && request.Longitude is not null)
        {
            stop.X = request.Longitude;
            stop.Y = request.Latitude;
        }
        else if (address != stop.Address)
        {
            // A new address without coordinates is located again; if it cannot be found,
            // the old position would be wrong, so it is cleared and located later.
            var point = await _geocoding.GeocodeAsync(address, cancellationToken);
            stop.X = point?.Longitude;
            stop.Y = point?.Latitude;
        }

        stop.Address = address;
        stop.ZoneId = request.ZoneId;

        await _context.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// A stop's orders belong to centers that must cover its zone (the zone of an order is its stop's zone),
    /// so the zone can only change to one that all those centers cover.
    /// </summary>
    private async Task EnsureOrdersStillCoveredAsync(int stopId, int newZoneId, CancellationToken cancellationToken)
    {
        var centerIds = await _context.Orders
            .Where(o => o.StopId == stopId)
            .Select(o => o.DistributionCenterId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (centerIds.Count == 0)
        {
            return;
        }

        var coveringCenters = await _context.CenterZones
            .Where(cz => cz.ZoneId == newZoneId && centerIds.Contains(cz.DistributionCenterId))
            .Select(cz => cz.DistributionCenterId)
            .Distinct()
            .CountAsync(cancellationToken);

        if (coveringCenters < centerIds.Count)
        {
            throw new AppValidationException(new[]
            {
                new ValidationFailure(
                    nameof(UpdateStopCommand.ZoneId),
                    "The stop has orders from centers that do not cover the new zone.")
            });
        }
    }
}
