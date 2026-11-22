using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;

namespace Smart_Routes.Web.Endpoints;

public class Reschedulings : IEndpointGroup
{
    public static string RoutePrefix => "/api/reschedulings";

    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.RequireAuthorization();

        groupBuilder.MapGet(List, "");
        groupBuilder.MapPost(Create, "").RequireAuthorization(new AuthorizeAttribute { Roles = Roles.DeliveryPerson });
        groupBuilder.MapPost(Resolve, "{id:int}/resolve").RequireAuthorization(new AuthorizeAttribute { Roles = Roles.LogisticsCoordinator });
    }

    [EndpointSummary("List rescheduling requests")]
    public static async Task<Ok<List<ReschedulingDto>>> List(IApplicationDbContext context, IUser currentUser)
    {
        if (string.IsNullOrWhiteSpace(currentUser.Id))
        {
            return TypedResults.Ok(new List<ReschedulingDto>());
        }

        var query = context.Reschedulings
            .AsNoTracking()
            .Include(r => r.RouteOrder).ThenInclude(ro => ro.Order)
            .Include(r => r.RouteOrder).ThenInclude(ro => ro.Route)
            .Include(r => r.ResolverCoordinator)
            .AsQueryable();

        // Delivery person: requests for routes they execute. Coordinator: requests assigned to them. Others: empty.
        // We need role info; IUser doesn't expose role, so filter broadly by relationships.
        query = query.Where(r => r.RouteOrder.Route.DeliveryPersonId == currentUser.Id || r.ResolverCoordinatorId == currentUser.Id);

        var items = await query
            .OrderByDescending(r => r.RequestDate)
            .ToListAsync();

        var result = items.Select(r => new ReschedulingDto(
            r.Id,
            r.RouteId,
            r.OrderId,
            r.RouteOrder?.Order?.Description ?? $"Pedido #{r.OrderId}",
            r.Reason,
            r.RequestDate,
            r.Status,
            r.ManualResult,
            r.ResolverCoordinatorId,
            "Coordinador" // name resolution simplified
        )).ToList();

        return TypedResults.Ok(result);
    }

    [EndpointSummary("Create a rescheduling request")]
    public static async Task<Results<Created<ReschedulingDto>, BadRequest<string>, NotFound<string>, Conflict<string>>> Create(
        CreateReschedulingRequest request,
        IApplicationDbContext context,
        IUser currentUser)
    {
        if (string.IsNullOrWhiteSpace(currentUser.Id))
        {
            return TypedResults.BadRequest("Usuario no autenticado.");
        }

        if (string.IsNullOrWhiteSpace(request.Reason) || string.IsNullOrWhiteSpace(request.ResolverCoordinatorId))
        {
            return TypedResults.BadRequest("Motivo y coordinador son obligatorios.");
        }

        var routeOrder = await context.RouteOrders
            .Include(ro => ro.Route)
            .Include(ro => ro.Order)
            .Include(ro => ro.Rescheduling)
            .FirstOrDefaultAsync(ro => ro.RouteId == request.RouteId && ro.OrderId == request.OrderId);

        if (routeOrder is null)
        {
            return TypedResults.NotFound("El pedido no pertenece a la ruta indicada.");
        }

        if (routeOrder.Route.DeliveryPersonId != currentUser.Id)
        {
            return TypedResults.BadRequest("Solo puedes solicitar reprogramación para tus rutas asignadas.");
        }

        if (routeOrder.Rescheduling is not null)
        {
            return TypedResults.Conflict("Ya existe una solicitud de reprogramación para este pedido en la ruta.");
        }

        var coordinatorExists = await context.LogisticsCoordinators.AnyAsync(c => c.Id == request.ResolverCoordinatorId);
        if (!coordinatorExists)
        {
            return TypedResults.BadRequest("El coordinador resolutor no es válido.");
        }

        var entity = new Rescheduling
        {
            RouteId = request.RouteId,
            OrderId = request.OrderId,
            Reason = request.Reason.Trim(),
            RequestDate = DateTimeOffset.UtcNow,
            Status = ReschedulingStatus.Pending,
            ResolverCoordinatorId = request.ResolverCoordinatorId,
        };

        context.Reschedulings.Add(entity);
        await context.SaveChangesAsync(CancellationToken.None);

        return TypedResults.Created($"/api/reschedulings/{entity.Id}", new ReschedulingDto(
            entity.Id,
            entity.RouteId,
            entity.OrderId,
            routeOrder.Order?.Description ?? $"Pedido #{entity.OrderId}",
            entity.Reason,
            entity.RequestDate,
            entity.Status,
            entity.ManualResult,
            entity.ResolverCoordinatorId,
            "Coordinador"));
    }

    [EndpointSummary("Resolve a rescheduling request")]
    public static async Task<Results<Ok<ReschedulingDto>, NotFound<string>, BadRequest<string>>> Resolve(
        int id,
        ResolveReschedulingRequest request,
        IApplicationDbContext context,
        IUser currentUser)
    {
        var entity = await context.Reschedulings
            .Include(r => r.RouteOrder).ThenInclude(ro => ro.Order)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (entity is null)
        {
            return TypedResults.NotFound("Solicitud no encontrada.");
        }

        if (entity.ResolverCoordinatorId != currentUser.Id)
        {
            return TypedResults.BadRequest("Solo el coordinador asignado puede resolver la solicitud.");
        }

        if (entity.Status == ReschedulingStatus.Resolved)
        {
            return TypedResults.BadRequest("La solicitud ya fue resuelta.");
        }

        entity.Status = ReschedulingStatus.Resolved;
        entity.ManualResult = request.ManualResult;
        entity.ResolutionDate = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(CancellationToken.None);

        return TypedResults.Ok(new ReschedulingDto(
            entity.Id,
            entity.RouteId,
            entity.OrderId,
            entity.RouteOrder?.Order?.Description ?? $"Pedido #{entity.OrderId}",
            entity.Reason,
            entity.RequestDate,
            entity.Status,
            entity.ManualResult,
            entity.ResolverCoordinatorId,
            "Coordinador"));
    }
}

public sealed record ReschedulingDto(
    int Id,
    int RouteId,
    int OrderId,
    string OrderDescription,
    string Reason,
    DateTimeOffset RequestDate,
    ReschedulingStatus Status,
    ManualResolution? ManualResult,
    string ResolverCoordinatorId,
    string ResolverCoordinatorName);

public sealed record CreateReschedulingRequest(int RouteId, int OrderId, string Reason, string ResolverCoordinatorId);
public sealed record ResolveReschedulingRequest(ManualResolution ManualResult);
