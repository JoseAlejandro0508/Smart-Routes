using Smart_Routes.Infrastructure.Identity;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Smart_Routes.Domain.Constants;


using Smart_Routes.Application.LogisticsCordinators.Commands.CreateLogisticsCordinator;



namespace Smart_Routes.Web.Endpoints;

public class LogisticsCoordinatorManagement : IEndpointGroup
{
    public static  string RoutePrefix => "/admin/logistics-coordinator";
    public static void Map(RouteGroupBuilder groupBuilder)
    {
        
        groupBuilder.RequireAuthorization((new AuthorizeAttribute
        {
            Roles = $"{Roles.Administrator}"
        }));
        groupBuilder.MapPost(CreateLogisticsCordinator, "create-logistics-coordinator");

    
    }

    [EndpointSummary("Add a Logistic Coordinator")]
    [EndpointDescription("Add a Logistic Coordinator role to the specified user assosciated with the provided userId")]
    public static async Task<Results<NoContent, BadRequest>> CreateLogisticsCordinator(ISender sender,CreateLogisticCordinatorCommand request )
    {
        await sender.Send(request);
        return TypedResults.NoContent();

    }

}
