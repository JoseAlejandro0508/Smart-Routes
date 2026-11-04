using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.Stops.Commands.CreateStop;

[Authorize(Roles = Roles.Administrator)]
public record CreateStopCommand : IRequest
{
    public required string Address { get; init; }
    public int ZoneId { get; init; }
}

public class CreateStopCommandHandler : IRequestHandler<CreateStopCommand>
{
    private readonly IApplicationDbContext _context;

    public CreateStopCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(CreateStopCommand request, CancellationToken cancellationToken)
    {
        var zoneExists = await _context.Zones.AnyAsync(z => z.Id == request.ZoneId, cancellationToken);
        if (!zoneExists)
        {
            throw new NotFoundException(nameof(Zone), request.ZoneId.ToString());
        }

        var stopExists = await _context.Stops
            .AnyAsync(s => s.ZoneId == request.ZoneId && s.Address == request.Address, cancellationToken);

        if (stopExists)
        {
            throw new ValidationException("A stop with this address already exists in the zone.");
        }

        var entity = new Stop
        {
            Address = request.Address.Trim(),
            ZoneId = request.ZoneId,
        };

        _context.Stops.Add(entity);

        await _context.SaveChangesAsync(cancellationToken);
    }
}
