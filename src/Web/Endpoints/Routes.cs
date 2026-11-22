using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Smart_Routes.Application.Common.Models;
using Smart_Routes.Application.Routes.Commands.AddReview;
using Smart_Routes.Application.Routes.Commands.Generate;
using Smart_Routes.Application.Routes.Commands.GetRouteByFilter;
using Smart_Routes.Application.Routes.Queries.GetRouteMap;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Web.Endpoints;

public class RoutesManagement : IEndpointGroup
{
    public static string RoutePrefix => "/api/routes";

    public static void Map(RouteGroupBuilder groupBuilder)
    {


        groupBuilder.MapPost(GenerateRoute, "generate").RequireAuthorization(new AuthorizeAttribute
        {
            Roles = $"{Roles.LogisticsCoordinator}"
        });
        groupBuilder.MapPost(AddReview, "add-review").RequireAuthorization(new AuthorizeAttribute
        {
            Roles = $"{Roles.OperationsSupervisor}"
        });
        groupBuilder.MapGet(GetRoutesByFilter, "filter").RequireAuthorization();
        groupBuilder.MapGet(GetRouteMap, "{id}/map").RequireAuthorization()
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    [EndpointSummary("Generate a route")]
    [EndpointDescription("Creates a route and returns the generated order sequence for the selected distribution center, delivery person and balance criterion.")]
    public static async Task<Results<Ok<GeneratedRouteDto>, BadRequest>> GenerateRoute(ISender sender, GenerateCommand request)
    {
        var result = await sender.Send(request);
        return TypedResults.Ok(result);
    }

    [EndpointSummary("Add a route review")]
    [EndpointDescription("Registers an operations supervisor review decision for a route and optionally associates a balance criterion.")]
    public static async Task<Results<NoContent, BadRequest>> AddReview(ISender sender, AddReviewCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Get routes by filter")]
    [EndpointDescription("Returns route data with ordered orders and optional balance criterion details according to the provided filters.")]
    public static async Task<Results<Ok<IList<RouteDto>>, BadRequest>> GetRoutesByFilter(
        ISender sender,
        [AsParameters] GetRouteByFilter request)
    {
        var result = await sender.Send(request);
        return TypedResults.Ok(result);
    }

    [EndpointSummary("Get the map of a route")]
    [EndpointDescription("Returns the distribution center, the stops in visiting order with their orders, and the path along the roads computed with OSRM on the OpenStreetMap road graph. Coordinates are [latitude, longitude] pairs, ready for Leaflet.")]
    public static async Task<Ok<RouteMapDto>> GetRouteMap(ISender sender, int id)
    {
        var result = await sender.Send(new GetRouteMapQuery(id));
        return TypedResults.Ok(result);
    }
}
