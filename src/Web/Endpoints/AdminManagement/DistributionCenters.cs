using Smart_Routes.Infrastructure.Identity;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Smart_Routes.Domain.Constants;

using Smart_Routes.Application.DistributionCenters.Commands.Create;
using Smart_Routes.Application.DistributionCenters.Commands.AddCoveredZone;
using Smart_Routes.Application.DistributionCenters.Commands.RemoveCoveredZone;
using Smart_Routes.Application.DistributionCenters.Commands.AddLogisticsCoordinators;
using Smart_Routes.Application.DistributionCenters.Commands.RemoveLogisticsCoordinators;
using Smart_Routes.Application.DistributionCenters.Commands.AddDeliveryPersons;
using Smart_Routes.Application.DistributionCenters.Commands.RemoveDeliveryPersons;
using Smart_Routes.Application.DistributionCenters.Queries.GetAll;
using Smart_Routes.Application.DistributionCenters.Queries.GetById;

namespace Smart_Routes.Web.Endpoints;

public class DistributionCenterManagement : IEndpointGroup
{
    public static string RoutePrefix => "/admin/distribution-center";

    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.RequireAuthorization(new AuthorizeAttribute
        {
            Roles = $"{Roles.Administrator}"
        });

        groupBuilder.MapGet(GetAll, "get-all");
        groupBuilder.MapGet(GetById, "{id:int}");

        groupBuilder.MapPost(CreateDistributionCenter, "create-distribution-center");

        groupBuilder.MapPost(AddCoveredZone, "add-covered-zone");
        groupBuilder.MapDelete(RemoveCoveredZones, "remove-covered-zones");

        groupBuilder.MapPost(AddLogisticsCoordinators, "add-logistics-coordinators");
        groupBuilder.MapDelete(RemoveLogisticsCoordinators, "remove-logistics-coordinators");

        groupBuilder.MapPost(AddDeliveryPersons, "add-delivery-persons");
        groupBuilder.MapDelete(RemoveDeliveryPersons, "remove-delivery-persons");
    }

    [EndpointSummary("Get all distribution centers")]
    [EndpointDescription("Returns the reduced list of distribution centers.")]
    public static async Task<Results<Ok<IEnumerable<DistributionCenterReducedDto>>, BadRequest>> GetAll(ISender sender)
    {
        var result = await sender.Send(new GetAllQuery());
        return TypedResults.Ok(result);
    }

    [EndpointSummary("Get distribution center by id")]
    [EndpointDescription("Returns the complete distribution center data with linked IDs.")]
    public static async Task<Results<Ok<DistributionCenterExtendedDto>, BadRequest>> GetById(ISender sender, int id)
    {
        var result = await sender.Send(new GetByIdQuery(id));
        return TypedResults.Ok(result);
    }

    [EndpointSummary("Create a distribution center")]
    [EndpointDescription("Creates a new Distribution Center.")]
    public static async Task<Results<NoContent, BadRequest>> CreateDistributionCenter(ISender sender, CreateCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Add covered zones")]
    [EndpointDescription("Adds one or more zones to a distribution center.")]
    public static async Task<Results<NoContent, BadRequest>> AddCoveredZone(ISender sender, AddCoveredZoneCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Remove covered zones")]
    [EndpointDescription("Removes one or more zones from a distribution center.")]
    public static async Task<Results<NoContent, BadRequest>> RemoveCoveredZones(ISender sender, RemoveCoveredZonesCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Add logistics coordinators")]
    [EndpointDescription("Assigns one or more logistics coordinators to a distribution center.")]
    public static async Task<Results<NoContent, BadRequest>> AddLogisticsCoordinators(ISender sender, AddLogisticsCoordinatorsCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Remove logistics coordinators")]
    [EndpointDescription("Removes one or more logistics coordinators from a distribution center.")]
    public static async Task<Results<NoContent, BadRequest>> RemoveLogisticsCoordinators(ISender sender, RemoveLogisticsCoordinatorsCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Add delivery persons")]
    [EndpointDescription("Assigns one or more delivery persons to a distribution center.")]
    public static async Task<Results<NoContent, BadRequest>> AddDeliveryPersons(ISender sender, AddDeliveryPersonsCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Remove delivery persons")]
    [EndpointDescription("Removes one or more delivery persons from a distribution center.")]
    public static async Task<Results<NoContent, BadRequest>> RemoveDeliveryPersons(ISender sender, RemoveDeliveryPersonsCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();
    }
}
