using Smart_Routes.Application.Orders.Commands.CreateOrder;
using Smart_Routes.Application.Orders.Queries.GetOrderById;
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
        groupBuilder.MapGet(GetOrderById, "{id}")
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    /// <summary>Registers a delivery order and returns its new identifier.</summary>
    [EndpointSummary("Create an order")]
    [EndpointDescription("Registers a delivery order for a distribution center and destination stop.")]
    public static async Task<Created<int>> CreateOrder(ISender sender, CreateOrderCommand command)
    {
        var id = await sender.Send(command);

        return TypedResults.Created($"/api/{nameof(Orders)}/{id}", id);
    }

    /// <summary>Returns an order when it belongs to a center the current coordinator can access.</summary>
    [EndpointSummary("Get an order by ID")]
    [EndpointDescription("Returns the order details if the authenticated coordinator is authorized for its center.")]
    public static async Task<Ok<OrderResponse>> GetOrderById(ISender sender, int id)
    {
        var order = await sender.Send(new GetOrderByIdQuery(id));

        return TypedResults.Ok(order);
    }
}