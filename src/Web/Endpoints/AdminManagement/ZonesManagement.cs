using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Smart_Routes.Application.Zones.Commands.CreateZone;
using Smart_Routes.Application.Zones.Commands.DeleteZone;
using Smart_Routes.Application.Zones.Queries.GetZones;
using Smart_Routes.Domain.Constants;

namespace Smart_Routes.Web.Endpoints;

public class ZonesManagement : IEndpointGroup
{
    public static string RoutePrefix => "/admin/zones";

    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.RequireAuthorization(new AuthorizeAttribute
        {
            Roles = $"{Roles.Administrator}"
        });

        groupBuilder.MapGet(GetZones, "get-all");
        groupBuilder.MapPost(CreateZone, "create-zone");
        groupBuilder.MapDelete(DeleteZone, "{zoneId:int}");
    }

    [EndpointSummary("Get all zones")]
    [EndpointDescription("Returns the list of all zones.")]
    public static async Task<Results<Ok<IEnumerable<ZoneDto>>, BadRequest>> GetZones(ISender sender)
    {
        var result = await sender.Send(new GetZonesQuery());
        return TypedResults.Ok(result);
    }

    [EndpointSummary("Create a zone")]
    [EndpointDescription("Creates a new zone.")]
    public static async Task<Results<NoContent, BadRequest>> CreateZone(ISender sender, CreateZoneCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete a zone")]
    [EndpointDescription("Deletes a zone by its identifier.")]
    public static async Task<Results<NoContent, BadRequest>> DeleteZone(ISender sender, int zoneId)
    {
        await sender.Send(new DeleteZoneCommand { ZoneId = zoneId });
        return TypedResults.NoContent();
    }
}
