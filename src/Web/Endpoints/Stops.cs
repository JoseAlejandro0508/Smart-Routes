using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Smart_Routes.Application.Stops.Commands.CreateStop;
using Smart_Routes.Application.Stops.Commands.DeleteStop;
using Smart_Routes.Application.Stops.Commands.UpdateStop;
using Smart_Routes.Application.Stops.Queries.GetStops;
using Smart_Routes.Domain.Constants;

namespace Smart_Routes.Web.Endpoints;

/// <summary>Physical delivery stops: any signed-in user lists them; coordinators and administrators change them.</summary>
public class StopsManagement : IEndpointGroup
{
    public static string RoutePrefix => "/stops";

    public static void Map(RouteGroupBuilder groupBuilder)
    {
        var writers = new AuthorizeAttribute { Roles = $"{Roles.LogisticsCoordinator},{Roles.Administrator}" };

        groupBuilder.RequireAuthorization();

        groupBuilder.MapGet(GetStops);
        groupBuilder.MapPost(CreateStop, "create-stop").RequireAuthorization(writers);
        groupBuilder.MapPut(UpdateStop, "{stopId:int}").RequireAuthorization(writers)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
        groupBuilder.MapDelete(DeleteStop, "{stopId:int}").RequireAuthorization(writers)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
    }

    [EndpointSummary("List stops")]
    [EndpointDescription("Returns the stops ordered by zone and address. Send zoneId to list only the stops of one zone.")]
    public static async Task<Ok<IReadOnlyList<StopDto>>> GetStops(ISender sender, int? zoneId)
    {
        var stops = await sender.Send(new GetStopsQuery(zoneId));
        return TypedResults.Ok(stops);
    }

    [EndpointSummary("Create a stop")]
    [EndpointDescription("Creates a new stop in a zone. Without latitude and longitude, the address is geocoded.")]
    public static async Task<Results<NoContent, BadRequest>> CreateStop(ISender sender, CreateStopCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Update a stop")]
    [EndpointDescription("Changes the address, zone or coordinates of a stop. A new address without coordinates is geocoded again.")]
    public static async Task<NoContent> UpdateStop(ISender sender, int stopId, UpdateStopCommand request)
    {
        await sender.Send(request with { StopId = stopId });
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete a stop")]
    [EndpointDescription("Deletes a stop by its identifier. A stop used by orders or routes cannot be deleted (409).")]
    public static async Task<Results<NoContent, BadRequest>> DeleteStop(ISender sender, int stopId)
    {
        await sender.Send(new DeleteStopCommand { StopId = stopId });
        return TypedResults.NoContent();
    }
}
