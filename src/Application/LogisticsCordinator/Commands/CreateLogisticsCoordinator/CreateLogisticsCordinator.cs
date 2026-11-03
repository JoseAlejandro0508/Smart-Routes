using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Application.Common.Security;
namespace Smart_Routes.Application.LogisticsCordinators.Commands.CreateLogisticsCordinator;

[Authorize(Roles = Roles.Administrator)]
public record CreateLogisticCordinatorCommand : IRequest
{
    public required string UserId { get; set; }
    public required string Speciality { get; set; }

}
public class CreateLogisticCordinatorCommandHandler : IRequestHandler<CreateLogisticCordinatorCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly IRoleManager _roleManager;

    public CreateLogisticCordinatorCommandHandler(IApplicationDbContext context, IRoleManager roleManager)
    {
        _context = context;
        _roleManager = roleManager;
    }

    public async Task Handle(CreateLogisticCordinatorCommand request, CancellationToken cancellationToken)
    {
        if (!await _roleManager.UserExistsAsync(request.UserId))
        {
            throw new ValidationException("User does not exist");
        }
        var roles = await _roleManager.GetUserRoleAsync(request.UserId);

        if (roles.Count > 0)
        {
            throw new ValidationException("User has a role assigned");
        }

        var entity = new LogisticsCoordinator
        {
            UserId = request.UserId,
            Specialty=request.Speciality
        };

        _context.LogisticsCoordinators.Add(entity);
        await _roleManager.AddUserRoleAsync(request.UserId, Roles.LogisticsCoordinator);
        await _context.SaveChangesAsync(cancellationToken);


    }
}
