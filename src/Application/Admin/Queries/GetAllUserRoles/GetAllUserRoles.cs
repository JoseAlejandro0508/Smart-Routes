using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.UserRoles.Queries.GetAllUserRoles;


public record GetAllUserRolesQuery: IRequest<List<IUser>>;

public class GetAllUserRolesQueryHandler : IRequestHandler<GetAllUserRolesQuery,List<IUser>>
{
    private readonly IRoleManager _roleManager;

    public GetAllUserRolesQueryHandler(IRoleManager roleManager)
    {
        _roleManager = roleManager;
    }
    
    public async Task<List<IUser>> Handle(GetAllUserRolesQuery request, CancellationToken cancellationToken)
    {

        var roles = await _roleManager.GetAllUsersRolesAsync();
        return roles;



    }
}
