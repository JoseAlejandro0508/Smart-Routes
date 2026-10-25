using Smart_Routes.Infrastructure.Identity;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Application.UserRoles.Commands.UpdateUserRole;
using Smart_Routes.Application.UserRoles.Commands.DeleteUserRole;
using Smart_Routes.Application.UserRoles.Commands.GetAllUserRoles;
using Smart_Routes.Application.Common.Interfaces;


namespace Smart_Routes.Web.Endpoints;

public class Admin : IEndpointGroup
{
    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.RequireAuthorization((new AuthorizeAttribute
        {
            Roles = $"{Roles.Administrator}"
        }));
        groupBuilder.MapPut(AddRole, "addrole");
    }

    [EndpointSummary("Add Role")]
    [EndpointDescription("Set a Role for the specified user")]
    public static async Task<Results<NoContent, BadRequest>> AddRole(ISender sender,UpdateUserRoleCommand request )
    {
        await sender.Send(request);
        return TypedResults.NoContent();

    }
    [EndpointSummary("Delete Role")]
    [EndpointDescription("Remove a Role from the specified user")]
    public static async Task<Results<NoContent, BadRequest>> DeleteRole(ISender sender, DeleteUserRoleCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();

    }
    [EndpointSummary("Get User Roles")]
    [EndpointDescription("Retruns a list where each object is a userId with the  asociated role for that user")]
    public static async Task<Results<Ok<List<IUser>>,BadRequest>> GetAllusersRoles(ISender sender)
    {
        List<IUser> usersRoles = await sender.Send(new GetAllUserRolesCommand());
        return TypedResults.Ok(usersRoles);
    }
}
