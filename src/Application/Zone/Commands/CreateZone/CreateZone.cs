using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;


namespace Smart_Routes.Application.Zones.Commands.CreateZone;
[Authorize(Roles = Roles.Administrator)]
public class CreateZoneCommand : IRequest
{
    public required string Name { get; init; }

}
public class CreateZoneCommandHandler:IRequestHandler<CreateZoneCommand>
{
    private readonly IApplicationDbContext _context;

    public CreateZoneCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(CreateZoneCommand request, CancellationToken cancellationToken)
    {
        var entity = new Zone
        {
            Name = request.Name
        };
        if(_context.Zones.Any(z => z.Name == request.Name))
        {
            throw new ValidationException("Zone already exists");
        }
        _context.Zones.Add(entity);

        await _context.SaveChangesAsync(cancellationToken);

      
    }
}