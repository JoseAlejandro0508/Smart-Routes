using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.DistributionCenters.Commands.RemoveDeliveryPersons;

[Authorize(Roles = Roles.Administrator)]
public record RemoveDeliveryPersonsCommand : IRequest
{
    public int DistributionCenterId { get; set; }
    public required IList<string> DeliveryPersonIds { get; set; }
}

public class RemoveDeliveryPersonsCommandHandler : IRequestHandler<RemoveDeliveryPersonsCommand>
{
    private readonly IApplicationDbContext _context;

    public RemoveDeliveryPersonsCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(RemoveDeliveryPersonsCommand request, CancellationToken cancellationToken)
    {
        var distributionCenter = await _context.DistributionCenters
            .Include(dc => dc.AssignedDeliveryPersons)
            .FirstOrDefaultAsync(dc => dc.Id == request.DistributionCenterId, cancellationToken);

        if (distributionCenter == null)
        {
            throw new NotFoundException(nameof(DistributionCenter), request.DistributionCenterId.ToString());
        }

        foreach (var deliveryPersonId in request.DeliveryPersonIds.Distinct())
        {
            if (string.IsNullOrWhiteSpace(deliveryPersonId))
            {
                throw new ValidationException("Delivery person ids cannot contain empty values.");
            }

            var deliveryPersonExists = await _context.DeliveryPersons
                .AnyAsync(dp => dp.Id == deliveryPersonId, cancellationToken);

            if (!deliveryPersonExists)
            {
                throw new NotFoundException(nameof(DeliveryPerson), deliveryPersonId);
            }

            var assignedDeliveryPerson = distributionCenter.AssignedDeliveryPersons
                .FirstOrDefault(dp => dp.DeliveryPersonId == deliveryPersonId);

            if (assignedDeliveryPerson == null)
            {
                throw new ValidationException($"Delivery person {deliveryPersonId} is not assigned to the Distribution Center");
            }

            _context.DeliveryPersonCenters.Remove(assignedDeliveryPerson);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
