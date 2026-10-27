using Smart_Routes.Application.Orders.Commands.CreateOrder;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Smart_Routes.Web.Endpoints;

/// <summary>HTTP endpoints for delivery order operations.</summary>
public class Orders : IEndpointGroup
{
    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.RequireAuthorization();
        groupBuilder.MapPost(CreateOrder)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
    }

    /// <summary>Registers a delivery order and returns its new identifier.</summary>
    [EndpointSummary("Create an order")]
    [EndpointDescription("Registers a delivery order for a distribution center and destination stop.")]
    public static async Task<Created<int>> CreateOrder(ISender sender, CreateOrderCommand command)
    {
        var id = await sender.Send(command);

        return TypedResults.Created($"/api/{nameof(Orders)}/{id}", id);
    }
}