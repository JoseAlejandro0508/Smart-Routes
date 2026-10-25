using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.UserRoles.Commands.DeleteUserRole;

public record DeleteUserRoleCommand : IRequest
{
    public string? UserId { get; init; }

}

public class DeleteUserRoleCommandHandler : IRequestHandler<DeleteUserRoleCommand>
{
    private readonly IRoleManager _roleManager;

    public DeleteUserRoleCommandHandler(IRoleManager roleManager)
    {
        _roleManager = roleManager;
    }
    
    public async Task Handle(DeleteUserRoleCommand request, CancellationToken cancellationToken)
    {



        var roles = await _roleManager.GetUserRoleAsync(request.UserId!);


        if (roles.Count == 1)
        {
            await _roleManager.RemoveUserRoleAsync(request.UserId!,roles[0]);
 
        }

    }
}
