using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.Stops.Commands.DeleteStop;

[Authorize(Roles = Roles.Administrator)]
public record DeleteStopCommand : IRequest
{
    public int StopId { get; set; }
}

public class DeleteStopCommandHandler : IRequestHandler<DeleteStopCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteStopCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteStopCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.Stops
            .Include(s => s.Orders)
            .Include(s => s.RouteStops)
            .FirstOrDefaultAsync(s => s.Id == request.StopId, cancellationToken);

        if (entity == null)
        {
            throw new NotFoundException(nameof(Stop), request.StopId.ToString());
        }

        if (entity.Orders.Any() || entity.RouteStops.Any())
        {
            throw new ValidationException("Stop cannot be deleted because it has associated orders or routes.");
        }

        _context.Stops.Remove(entity);

        await _context.SaveChangesAsync(cancellationToken);
    }
}
