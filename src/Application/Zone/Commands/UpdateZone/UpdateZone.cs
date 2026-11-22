using Smart_Routes.Application.Common.Exceptions;
using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.Zones.Commands.UpdateZone;

/// <summary>Renombra una zona existente.</summary>
[Authorize(Roles = Roles.Administrator)]
public class UpdateZoneCommand : IRequest
{
    public int ZoneId { get; init; }
    public required string Name { get; init; }
}

public class UpdateZoneCommandHandler : IRequestHandler<UpdateZoneCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateZoneCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateZoneCommand request, CancellationToken cancellationToken)
    {
        var zone = await _context.Zones.FindAsync(new object[] { request.ZoneId }, cancellationToken);
        if (zone is null)
        {
            throw new NotFoundException(nameof(Zone), request.ZoneId.ToString());
        }

        if (await _context.Zones.AnyAsync(
                candidate => candidate.Id != request.ZoneId && candidate.Name == request.Name,
                cancellationToken))
        {
            throw new ConflictException("Ya existe una zona con ese nombre.");
        }

        zone.Name = request.Name;
        await _context.SaveChangesAsync(cancellationToken);
    }
}
