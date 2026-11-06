using Smart_Routes.Infrastructure.Identity;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Smart_Routes.Domain.Constants;


using Smart_Routes.Application.OperationsSupervisors.Commands.CreateOperationsSupervisor;


namespace Smart_Routes.Web.Endpoints;

public class OperationsSupervisorManagement : IEndpointGroup
{
    public static string RoutePrefix => "/admin/operations-supervisor";
    public static void Map(RouteGroupBuilder groupBuilder)
    {

        groupBuilder.RequireAuthorization((new AuthorizeAttribute
        {
            Roles = $"{Roles.Administrator}"
        }));
        groupBuilder.MapPost(CreateOperationsSupervisor, "create-operations-supervisor");


    }


    [EndpointSummary("Add a Operations Supervisor")]
    [EndpointDescription("Add a Operations Supervisor role to the specified user assosciated with the provided userId")]
    public static async Task<Results<NoContent, BadRequest>> CreateOperationsSupervisor(ISender sender, CreateOperationsSupervisorCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();
    }
}