using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Application.Common.Security;
namespace Smart_Routes.Application.OperationsSupervisors.Commands.CreateOperationsSupervisor;

[Authorize(Roles = Roles.Administrator)]
public record CreateOperationsSupervisorCommand : IRequest
{
    public required string UserId { get; set; }
    public required string ControlArea { get; set; }

}
public class CreateOperationsSupervisorCommandHandler : IRequestHandler<CreateOperationsSupervisorCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly IRoleManager _roleManager;

    public CreateOperationsSupervisorCommandHandler(IApplicationDbContext context, IRoleManager roleManager)
    {
        _context = context;
        _roleManager = roleManager;
    }

    public async Task Handle(CreateOperationsSupervisorCommand request, CancellationToken cancellationToken)
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

        var entity = new OperationsSupervisor
        {
            UserId = request.UserId,
            ControlArea=request.ControlArea
        };

        _context.OperationsSupervisors.Add(entity);
        await _roleManager.AddUserRoleAsync(request.UserId, Roles.OperationsSupervisor);
        await _context.SaveChangesAsync(cancellationToken);


    }
}
