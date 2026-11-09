using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;


namespace Smart_Routes.Application.DistributionCenters.Commands.Create;
[Authorize(Roles = Roles.Administrator)]
public class CreateCommand : IRequest
{
    public required string Name { get; init; }
    public required string LogisticProgram { get; init; }

}
public class CreateCommandHandler:IRequestHandler<CreateCommand>
{
    private readonly IApplicationDbContext _context;

    public CreateCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(CreateCommand request, CancellationToken cancellationToken)
    {
        var entity = new DistributionCenter
        {
            Name = request.Name,
            LogisticsProgram=request.LogisticProgram,
        };
        if(_context.DistributionCenters.Any(dc => dc.Name == dc.Name))
        {
            throw new ValidationException("Distribution Center name  already exists");
        }
        _context.DistributionCenters.Add(entity);

        await _context.SaveChangesAsync(cancellationToken);

      
    }
}