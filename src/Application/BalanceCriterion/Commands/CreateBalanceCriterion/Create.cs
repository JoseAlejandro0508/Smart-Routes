using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;
using Smart_Routes.Application.Common.Models;
namespace Smart_Routes.Application.BalanceCriterions.Commands.Generate;

[Authorize(Roles = $"{Roles.LogisticsCoordinator},{Roles.Administrator}")]
public record CreateBalanceCriterionCommand : IRequest<int>
{
    public required string Name { get; init; }
    public required string Description { get; init; }


    public required IList<CustomBalancedParameterDto> CustomBalancedParameters { get; init; }

}


public class CreateBalanceCriterionCommandHandler : IRequestHandler<CreateBalanceCriterionCommand,int>
{
    private readonly IApplicationDbContext _context;
    private readonly IUser _user;


    public CreateBalanceCriterionCommandHandler(IApplicationDbContext context, IUser user)
    {
        _context = context;
        _user = user;
    }

    public async Task<int> Handle(CreateBalanceCriterionCommand request, CancellationToken cancellationToken)

    {
        bool isLogisticsCoordinator = _user.Roles!.FirstOrDefault(x => x == Roles.LogisticsCoordinator) != null;
        var criterion = BalanceCriterionBuilder.Build(
            request.Name,
            request.Description,
            request.CustomBalancedParameters,
            isLogisticsCoordinator ? _user.Id : null);

        // One save inserts the criterion and its parameters in the same transaction.
        await _context.BalanceCriteria.AddAsync(criterion, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return criterion.Id;
        }
    }
