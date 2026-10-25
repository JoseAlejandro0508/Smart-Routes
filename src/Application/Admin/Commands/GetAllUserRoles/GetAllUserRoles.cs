using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.UserRoles.Commands.GetAllUserRoles;

public record GetAllUserRolesCommand : IRequest<List<IUser>>
{


}

public class GetAllUserRolesCommandHandler : IRequestHandler<GetAllUserRolesCommand,List<IUser>>
{
    private readonly IRoleManager _roleManager;

    public GetAllUserRolesCommandHandler(IRoleManager roleManager)
    {
        _roleManager = roleManager;
    }
    
    public async Task<List<IUser>> Handle(GetAllUserRolesCommand request, CancellationToken cancellationToken)
    {

        var roles = await _roleManager.GetAllUsersRolesAsync();
        return roles;



    }
}
