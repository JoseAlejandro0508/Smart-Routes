using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.BalanceCriterions.Commands.DeleteBalanceCriterion;

[Authorize(Roles = $"{Roles.LogisticsCoordinator},{Roles.Administrator}")]
public record DeleteBalanceCriterionCommand : IRequest
{
    public int BalanceCriterionId { get; set; }
}

public class DeleteBalanceCriterionCommandHandler : IRequestHandler<DeleteBalanceCriterionCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteBalanceCriterionCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteBalanceCriterionCommand request, CancellationToken cancellationToken)
    {
        var criterion = await _context.BalanceCriteria
            .Include(c => c.Parameters)
            .FirstOrDefaultAsync(c => c.Id == request.BalanceCriterionId, cancellationToken);

        if (criterion == null)
        {
            throw new NotFoundException(nameof(BalanceCriterion), request.BalanceCriterionId.ToString());
        }

        var parameterIds = criterion.Parameters.Select(p => p.Id).ToList();

        if (parameterIds.Count > 0)
        {
            var routeParameters = await _context.RouteParameters
                .Where(rp => rp.BalanceCriterionId == request.BalanceCriterionId)
                .ToListAsync(cancellationToken);

            var reviewParameters = await _context.ReviewParameters
                .Where(rp => parameterIds.Contains(rp.BalanceParameterId))
                .ToListAsync(cancellationToken);

            if (routeParameters.Count > 0)
            {
                _context.RouteParameters.RemoveRange(routeParameters);
            }

            if (reviewParameters.Count > 0)
            {
                _context.ReviewParameters.RemoveRange(reviewParameters);
            }

            _context.BalanceParameters.RemoveRange(criterion.Parameters);
        }

        _context.BalanceCriteria.Remove(criterion);

        await _context.SaveChangesAsync(cancellationToken);
    }
}
