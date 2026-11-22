using Smart_Routes.Application.Common.Exceptions;
using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.DistributionCenters.Commands.Delete;

/// <summary>Elimina un centro de distribución sin pedidos ni rutas dependientes.</summary>
[Authorize(Roles = Roles.Administrator)]
public record DeleteDistributionCenterCommand(int Id) : IRequest;

public class DeleteDistributionCenterCommandHandler : IRequestHandler<DeleteDistributionCenterCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteDistributionCenterCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteDistributionCenterCommand request, CancellationToken cancellationToken)
    {
        var center = await _context.DistributionCenters
            .Include(entity => entity.CoveredZones)
            .Include(entity => entity.AuthorizedCoordinators)
            .Include(entity => entity.AssignedDeliveryPersons)
            .Include(entity => entity.Orders)
            .Include(entity => entity.Routes)
            .FirstOrDefaultAsync(entity => entity.Id == request.Id, cancellationToken);

        if (center is null)
        {
            throw new NotFoundException(nameof(DistributionCenter), request.Id.ToString());
        }

        if (center.Orders.Count > 0 || center.Routes.Count > 0)
        {
            throw new ConflictException(
                "No se puede eliminar el centro porque tiene pedidos o rutas asociadas.");
        }

        _context.CenterZones.RemoveRange(center.CoveredZones);
        _context.CoordinatorCenters.RemoveRange(center.AuthorizedCoordinators);
        _context.DeliveryPersonCenters.RemoveRange(center.AssignedDeliveryPersons);
        _context.DistributionCenters.Remove(center);

        await _context.SaveChangesAsync(cancellationToken);
    }
}
