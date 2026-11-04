using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;



namespace Smart_Routes.Application.DistributionCenters.Queries.GetAll;
[Authorize]
public record GetAllQuery : IRequest<IEnumerable<DistributionCenterReducedDto>>;

public class GetAllQueryHandler : IRequestHandler<GetAllQuery, IEnumerable<DistributionCenterReducedDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;
    public GetAllQueryHandler(IApplicationDbContext context,IMapper mapper)
    {
        _context = context;
         _mapper = mapper;
    }

    public async Task<IEnumerable<DistributionCenterReducedDto>> Handle(GetAllQuery request, CancellationToken cancellationToken)
    {
        var distributionCenters = await _context.DistributionCenters.AsNoTracking().ProjectTo<DistributionCenterReducedDto>(_mapper.ConfigurationProvider).ToListAsync(cancellationToken);

        return distributionCenters;
    }
}