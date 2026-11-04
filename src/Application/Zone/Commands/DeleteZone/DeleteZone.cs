using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;

namespace Smart_Routes.Application.Zones.Commands.DeleteZone;
[Authorize(Roles = Roles.Administrator)]
public record DeleteZoneCommand : IRequest
{
    public int ZoneId { get; set;}

}
public class DeleteZoneCommandHandler : IRequestHandler<DeleteZoneCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteZoneCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteZoneCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.Zones.FindAsync(request.ZoneId , cancellationToken);

        if (entity == null)
        {
            throw new NotFoundException("Zone not found", request.ZoneId.ToString());
        }

        _context.Zones.Remove(entity);

        await _context.SaveChangesAsync(cancellationToken);
    }
}