using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.UserRoles.Commands.UpdateUserRole;

public record UpdateUserRoleCommand : IRequest
{
    public string? UserId { get; init; }

    public string? Role { get; init; }
}

public class UpdateUserRoleCommandHandler : IRequestHandler<UpdateUserRoleCommand>
{
    private readonly IRoleManager _roleManager;

    public UpdateUserRoleCommandHandler(IRoleManager roleManager)
    {
        _roleManager = roleManager;
    }
    
    public async Task Handle(UpdateUserRoleCommand request, CancellationToken cancellationToken)
    {



        var roles = await _roleManager.GetUserRoleAsync(request.UserId!);

        if (roles.Count>1)
        {
            throw new ValidationException("User has more than one role assigned. Please remove one role before adding a new one.");
        }
        if (roles.Count == 1)
        {
            await _roleManager.RemoveUserRoleAsync(request.UserId!,roles[0]);
            await _roleManager.AddUserRoleAsync(request.UserId!,request.Role!);
        }
        else
        {
            await _roleManager.AddUserRoleAsync(request.UserId!, request.Role!);
        }


    }
}
