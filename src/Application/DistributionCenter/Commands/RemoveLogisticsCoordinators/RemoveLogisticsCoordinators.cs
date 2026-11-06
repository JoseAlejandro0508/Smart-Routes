using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.DistributionCenters.Commands.RemoveLogisticsCoordinators;

[Authorize(Roles = Roles.Administrator)]
public record RemoveLogisticsCoordinatorsCommand : IRequest
{
    public int DistributionCenterId { get; set; }
    public required IList<string> CoordinatorIds { get; set; }
}

public class RemoveLogisticsCoordinatorsCommandHandler : IRequestHandler<RemoveLogisticsCoordinatorsCommand>
{
    private readonly IApplicationDbContext _context;

    public RemoveLogisticsCoordinatorsCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(RemoveLogisticsCoordinatorsCommand request, CancellationToken cancellationToken)
    {
        var distributionCenter = await _context.DistributionCenters
            .Include(dc => dc.AuthorizedCoordinators)
            .FirstOrDefaultAsync(dc => dc.Id == request.DistributionCenterId, cancellationToken);

        if (distributionCenter == null)
        {
            throw new NotFoundException(nameof(DistributionCenter), request.DistributionCenterId.ToString());
        }

        foreach (var coordinatorId in request.CoordinatorIds.Distinct())
        {
            if (string.IsNullOrWhiteSpace(coordinatorId))
            {
                throw new ValidationException("Coordinator ids cannot contain empty values.");
            }

            var coordinatorExists = await _context.LogisticsCoordinators
                .AnyAsync(c => c.Id == coordinatorId, cancellationToken);

            if (!coordinatorExists)
            {
                throw new NotFoundException(nameof(LogisticsCoordinator), coordinatorId);
            }

            var authorizedCoordinator = distributionCenter.AuthorizedCoordinators
                .FirstOrDefault(cc => cc.CoordinatorId == coordinatorId);

            if (authorizedCoordinator == null)
            {
                throw new ValidationException($"Coordinator {coordinatorId} is not assigned to the Distribution Center");
            }

            _context.CoordinatorCenters.Remove(authorizedCoordinator);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
