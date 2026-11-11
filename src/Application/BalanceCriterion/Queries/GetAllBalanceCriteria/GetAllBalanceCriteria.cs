using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Application.Common.Models;
namespace Smart_Routes.Application.BalanceCriterions.Queries.GetAllBalanceCriteria;

[Authorize]
public record GetAllBalanceCriteriaQuery : IRequest<IEnumerable<BalanceCriterionWithParametersDto>>;

public class GetAllBalanceCriteriaQueryHandler : IRequestHandler<GetAllBalanceCriteriaQuery, IEnumerable<BalanceCriterionWithParametersDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAllBalanceCriteriaQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<BalanceCriterionWithParametersDto>> Handle(GetAllBalanceCriteriaQuery request, CancellationToken cancellationToken)
    {
        var criteria = await _context.BalanceCriteria
            .AsNoTracking()
            .Include(c => c.Parameters)
            .OrderBy(c => c.Id)
            .ToListAsync(cancellationToken);

        return criteria.Select(c => new BalanceCriterionWithParametersDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            AuthorCoordinatorId = c.AuthorCoordinatorId,
            IsPredefined = c.IsPredefined,
            Parameters = c.Parameters
                .OrderBy(p => p.Id)
                .Select(p => new BalanceParameterDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Metric = p.Metric,
                    Operator = p.Operator,
                    AppliedValue = p.AppliedValue,
                    TargetDeliveryType = p.TargetDeliveryType,
                    BalanceCriterionId = p.BalanceCriterionId
                })
                .ToList()
        }).ToList();
    }
}
