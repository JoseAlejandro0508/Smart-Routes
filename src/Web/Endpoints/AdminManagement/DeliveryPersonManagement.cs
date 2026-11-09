using Smart_Routes.Infrastructure.Identity;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Smart_Routes.Domain.Constants;

using Smart_Routes.Application.DeliveryPersons.Commands.CreateDeliveryPerson;



namespace Smart_Routes.Web.Endpoints;

public class DeliveryPersonManagement : IEndpointGroup
{
    public static string RoutePrefix => "/admin/delivery-person";
    public static void Map(RouteGroupBuilder groupBuilder)
    {

        groupBuilder.RequireAuthorization((new AuthorizeAttribute
        {
            Roles = $"{Roles.Administrator}"
        }));
        groupBuilder.MapPost(CreateDeliveryPerson, "create-delivery-person");


    }


    [EndpointSummary("Add a Delivery Person")]
    [EndpointDescription("Add a Delivery Person role to the specified user assosciated with the provided userId")]
    public static async Task<Results<NoContent, BadRequest>> CreateDeliveryPerson(ISender sender, CreateDeliveryPersonCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();

    }

}
