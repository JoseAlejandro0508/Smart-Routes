using Smart_Routes.Application.Orders.Commands.CreateOrder;
using Smart_Routes.Application.Orders.Queries.GetOrderById;
using Smart_Routes.Application.Orders.Queries.ListOrders;
using Smart_Routes.Domain.Enums;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Smart_Routes.Web.Endpoints;

/// <summary>HTTP endpoints for delivery order operations.</summary>
public class Orders : IEndpointGroup
{
    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.RequireAuthorization();
        groupBuilder.MapPost(CreateOrder)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
        groupBuilder.MapGet(GetOrders)
            .ProducesProblem(StatusCodes.Status403Forbidden);
        groupBuilder.MapGet(GetOrderById, "{id}")
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    /// <summary>Registers a delivery order and returns its summary.</summary>
    [EndpointSummary("Create an order")]
    [EndpointDescription("Registers a delivery order for a distribution center and destination stop.")]
    public static async Task<Created<OrderResponse>> CreateOrder(ISender sender, CreateOrderCommand command)
    {
        var id = await sender.Send(command);
        var order = await sender.Send(new GetOrderByIdQuery(id));

        return TypedResults.Created($"/api/orders/{id}", order);
    }

    /// <summary>Lists orders accessible to the current coordinator, with optional filters and pagination.</summary>
    [EndpointSummary("List orders")]
    [EndpointDescription("Returns a paginated list of orders in centers assigned to the authenticated coordinator.")]
    public static async Task<Ok<OrderResponse[]>> GetOrders(
        ISender sender,
        HttpContext httpContext,
        int? distributionCenterId,
        int? zoneId,
        DeliveryType? deliveryType,
        OrderPriority? priority,
        OrderStatus? status,
        int pageNumber = 1,
        int pageSize = 20)
    {
        var orders = await sender.Send(new ListOrdersQuery(
            distributionCenterId,
            zoneId,
            deliveryType,
            priority,
            status,
            pageNumber,
            pageSize));

        httpContext.Response.Headers["X-Total-Count"] = orders.TotalCount.ToString(System.Globalization.CultureInfo.InvariantCulture);
        httpContext.Response.Headers["X-Page-Number"] = orders.PageNumber.ToString(System.Globalization.CultureInfo.InvariantCulture);
        httpContext.Response.Headers["X-Page-Size"] = orders.PageSize.ToString(System.Globalization.CultureInfo.InvariantCulture);

        return TypedResults.Ok(orders.Items.ToArray());
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