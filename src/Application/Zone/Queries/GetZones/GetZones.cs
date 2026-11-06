using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
namespace Smart_Routes.Application.Zones.Queries.GetZones;
[Authorize]
public record GetZonesQuery() : IRequest<IEnumerable<ZoneDto>>;
public class GetZonesQueryHandler : IRequestHandler<GetZonesQuery, IEnumerable<ZoneDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetZonesQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ZoneDto>> Handle(GetZonesQuery request, CancellationToken cancellationToken)
    {
        var zones = await _context.Zones.AsNoTracking().ProjectTo<ZoneDto>(_mapper.ConfigurationProvider).ToListAsync(cancellationToken);

        return zones;
    }
}