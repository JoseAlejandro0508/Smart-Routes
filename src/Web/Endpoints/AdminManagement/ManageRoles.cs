using Smart_Routes.Infrastructure.Identity;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Smart_Routes.Domain.Constants;

using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.LogisticsCordinators.Commands.CreateLogisticsCordinator;
using Smart_Routes.Application.DeliveryPersons.Commands.CreateDeliveryPerson;
using Smart_Routes.Application.OperationsSupervisors.Commands.CreateOperationsSupervisor;


namespace Smart_Routes.Web.Endpoints;

public class Admin : IEndpointGroup
{
    public static  string RoutePrefix => "/admin/manage-roles";
    public static void Map(RouteGroupBuilder groupBuilder)
    {
        
        groupBuilder.RequireAuthorization((new AuthorizeAttribute
        {
            Roles = $"{Roles.Administrator}"
        }));
        groupBuilder.MapPost(CreateDeliveryPerson, "create-delivery-person");
        groupBuilder.MapPost(CreateOperationsSupervisor, "create-operations-supervisor");
        groupBuilder.MapPost(CreateLogisticsCordinator, "create-logistics-cordinator");
    
    }

    [EndpointSummary("Add a Logistic Coordinator")]
    [EndpointDescription("Add a Logistic Coordinator role to the specified user assosciated with the provided userId")]
    public static async Task<Results<NoContent, BadRequest>> CreateLogisticsCordinator(ISender sender,CreateLogisticCordinatorCommand request )
    {
        await sender.Send(request);
        return TypedResults.NoContent();

    }
    [EndpointSummary("Add a Delivery Person")]
    [EndpointDescription("Add a Delivery Person role to the specified user assosciated with the provided userId")]
    public static async Task<Results<NoContent, BadRequest>> CreateDeliveryPerson(ISender sender, CreateDeliveryPersonCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();

    }
    [EndpointSummary("Add a Operations Supervisor")]
    [EndpointDescription("Add a Operations Supervisor role to the specified user assosciated with the provided userId")]
    public static async Task<Results<NoContent, BadRequest>> CreateOperationsSupervisor(ISender sender,CreateOperationsSupervisorCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();
    }
}
