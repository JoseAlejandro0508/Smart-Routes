using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.DistributionCenters.Commands.AddDeliveryPersons;

[Authorize(Roles = Roles.Administrator)]
public record AddDeliveryPersonsCommand : IRequest
{
    public int DistributionCenterId { get; set; }
    public required IList<string> DeliveryPersonIds { get; set; }
}

public class AddDeliveryPersonsCommandHandler : IRequestHandler<AddDeliveryPersonsCommand>
{
    private readonly IApplicationDbContext _context;

    public AddDeliveryPersonsCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(AddDeliveryPersonsCommand request, CancellationToken cancellationToken)
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

            var isAlreadyAssigned = distributionCenter.AssignedDeliveryPersons.Any(dp => dp.DeliveryPersonId == deliveryPersonId);
            if (isAlreadyAssigned)
            {
                throw new ValidationException($"Delivery person {deliveryPersonId} is already assigned to the Distribution Center");
            }

            _context.DeliveryPersonCenters.Add(new DeliveryPersonCenter
            {
                DistributionCenterId = distributionCenter.Id,
                DeliveryPersonId = deliveryPersonId,
            });
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
