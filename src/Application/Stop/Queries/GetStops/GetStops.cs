using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;

namespace Smart_Routes.Application.Stops.Queries.GetStops;

/// <summary>Lists the stops, optionally only those of one zone.</summary>
/// <param name="ZoneId">Zone to filter by; null lists every stop.</param>
[Authorize]
public record GetStopsQuery(int? ZoneId = null) : IRequest<IReadOnlyList<StopDto>>;

/// <summary>A stop as the client sees it.</summary>
/// <param name="Id">Stop identifier.</param>
/// <param name="Address">Stop address.</param>
/// <param name="ZoneId">Zone the stop is located in.</param>
/// <param name="ZoneName">Name of that zone.</param>
/// <param name="Latitude">Latitude, or null if the stop is not located on the map.</param>
/// <param name="Longitude">Longitude, or null if the stop is not located on the map.</param>
public sealed record StopDto(int Id, string Address, int ZoneId, string ZoneName, double? Latitude, double? Longitude);

/// <summary>Validates the zone filter.</summary>
public sealed class GetStopsQueryValidator : AbstractValidator<GetStopsQuery>
{
    public GetStopsQueryValidator()
    {
        RuleFor(q => q.ZoneId)
            .GreaterThan(0)
            .When(q => q.ZoneId.HasValue);
    }
}

/// <summary>Reads the stops ordered by zone and address.</summary>
public class GetStopsQueryHandler : IRequestHandler<GetStopsQuery, IReadOnlyList<StopDto>>
{
    private readonly IApplicationDbContext _context;

    /// <summary>Creates the handler.</summary>
    public GetStopsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<StopDto>> Handle(GetStopsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Stops.AsNoTracking();

        if (request.ZoneId.HasValue)
        {
            query = query.Where(s => s.ZoneId == request.ZoneId.Value);
        }

        return await query
            .OrderBy(s => s.Zone.Name)
            .ThenBy(s => s.Address)
            .Select(s => new StopDto(s.Id, s.Address, s.ZoneId, s.Zone.Name, s.Y, s.X))
            .ToListAsync(cancellationToken);
    }
}
