using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Smart_Routes.Application.BalanceCriterions.Commands.DeleteBalanceCriterion;
using Smart_Routes.Application.BalanceCriterions.Commands.Generate;
using Smart_Routes.Application.BalanceCriterions.Queries.GetAllBalanceCriteria;
using Smart_Routes.Application.Common.Models;
using Smart_Routes.Domain.Constants;

namespace Smart_Routes.Web.Endpoints;

public class BalanceCriteriaManagement : IEndpointGroup
{
    public static string RoutePrefix => "/balance-criteria";

    public static void Map(RouteGroupBuilder groupBuilder)
    {


        groupBuilder.MapGet(GetAllBalanceCriteria, "get-all").RequireAuthorization();
        
        groupBuilder.MapPost(CreateBalanceCriterion, "create-balance-criterion").RequireAuthorization(new AuthorizeAttribute
        {
            Roles = $"{Roles.LogisticsCoordinator},{Roles.Administrator}"
        }); 

        groupBuilder.MapDelete(DeleteBalanceCriterion, "{id:int}").RequireAuthorization(new AuthorizeAttribute
        {
            Roles = $"{Roles.LogisticsCoordinator},{Roles.Administrator}"
        }); 
    }

    [EndpointSummary("Get all balance criteria")]
    [EndpointDescription("Returns all balance criteria including their parameters.")]
    public static async Task<Results<Ok<IEnumerable<BalanceCriterionWithParametersDto>>, BadRequest>> GetAllBalanceCriteria(ISender sender)
    {
        var result = await sender.Send(new GetAllBalanceCriteriaQuery());
        return TypedResults.Ok(result);
    }

    [EndpointSummary("Create a balance criterion")]
    [EndpointDescription("Creates a balance criterion with its custom parameters and returns the created balance criterion's identifier.")]
    public static async Task<Results<Ok<int>, BadRequest>> CreateBalanceCriterion(ISender sender, CreateBalanceCriterionCommand request)
    {
        var result = await sender.Send(request);
        return TypedResults.Ok<int>(result);
    }

    [EndpointSummary("Delete a balance criterion")]
    [EndpointDescription("Deletes a balance criterion and all of its associated parameters.")]
    public static async Task<Results<NoContent, BadRequest>> DeleteBalanceCriterion(ISender sender, int id)
    {
        await sender.Send(new DeleteBalanceCriterionCommand { BalanceCriterionId = id });
        return TypedResults.NoContent();
    }
}
