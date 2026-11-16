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

    /// <summary>Optional latitude of the center; routes start and end here when it is known.</summary>
    public double? Latitude { get; init; }

    /// <summary>Optional longitude of the center; routes start and end here when it is known.</summary>
    public double? Longitude { get; init; }

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
            X = request.Longitude,
            Y = request.Latitude,
        };
        if(_context.DistributionCenters.Any(dc => dc.Name == request.Name))
        {
            throw new ValidationException("Distribution Center name  already exists");
        }
        _context.DistributionCenters.Add(entity);

        await _context.SaveChangesAsync(cancellationToken);

      
    }
}