using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Smart_Routes.Application.Stops.Commands.CreateStop;
using Smart_Routes.Application.Stops.Commands.DeleteStop;
using Smart_Routes.Domain.Constants;

namespace Smart_Routes.Web.Endpoints;

public class StopsManagement : IEndpointGroup
{
    public static string RoutePrefix => "/stops";

    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.RequireAuthorization(new AuthorizeAttribute
        {
            Roles = $"{Roles.LogisticsCoordinator}"
        });

        groupBuilder.MapPost(CreateStop, "create-stop");
        groupBuilder.MapDelete(DeleteStop, "{stopId:int}");
    }

    [EndpointSummary("Create a stop")]
    [EndpointDescription("Creates a new stop in a zone.")]
    public static async Task<Results<NoContent, BadRequest>> CreateStop(ISender sender, CreateStopCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete a stop")]
    [EndpointDescription("Deletes a stop by its identifier.")]
    public static async Task<Results<NoContent, BadRequest>> DeleteStop(ISender sender, int stopId)
    {
        await sender.Send(new DeleteStopCommand { StopId = stopId });
        return TypedResults.NoContent();
    }
}
