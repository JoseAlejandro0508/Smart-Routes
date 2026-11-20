using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;

namespace Smart_Routes.Web.Endpoints;

public class Deliveries : IEndpointGroup
{
    public static string RoutePrefix => "/api/delivery";

    public static void Map(RouteGroupBuilder groupBuilder)
    {
        var deliveryPerson = new AuthorizeAttribute { Roles = Roles.DeliveryPerson };
        var reportsReaders = new AuthorizeAttribute { Roles = $"{Roles.Administrator},{Roles.OperationsSupervisor},{Roles.LogisticsCoordinator}" };

        groupBuilder.MapGet(GetAssignedRoutes, "routes").RequireAuthorization(deliveryPerson);
        groupBuilder.MapPost(RecordDelivery, "routes/{routeId:int}/stops/{orderId:int}").RequireAuthorization(deliveryPerson)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
        groupBuilder.MapGet(GetDeliveryReportsByCenter, "reports/by-center").RequireAuthorization(reportsReaders);
    }

    [EndpointSummary("List assigned routes for the current delivery person")]
    public static async Task<Ok<List<AssignedRouteDto>>> GetAssignedRoutes(IApplicationDbContext context, IUser currentUser)
    {
        if (string.IsNullOrWhiteSpace(currentUser.Id))
        {
            return TypedResults.Ok(new List<AssignedRouteDto>());
        }

        var routes = await context.Routes
            .AsNoTracking()
            .Include(r => r.DistributionCenter)
            .Include(r => r.Reviews)
            .Include(r => r.RouteStops).ThenInclude(rs => rs.Stop).ThenInclude(s => s.Zone)
            .Include(r => r.RouteOrders).ThenInclude(ro => ro.Order)
            .Include(r => r.RouteOrders).ThenInclude(ro => ro.DeliveryRecord)
            .Where(r => r.DeliveryPersonId == currentUser.Id)
            .ToListAsync();

        var approvedRoutes = routes
            .Where(IsApproved)
            .OrderBy(r => r.ScheduledDate)
            .ToList();

        var result = new List<AssignedRouteDto>(approvedRoutes.Count);

        foreach (var route in approvedRoutes)
        {
            var orderedStops = route.RouteStops
                .OrderBy(rs => rs.VisitOrder)
                .Select(rs => rs.Stop)
                .ToList();

            var items = new List<AssignedStopDto>();
            foreach (var stop in orderedStops)
            {
                var ordersForStop = route.RouteOrders
                    .Where(ro => ro.Order.StopId == stop.Id)
                    .OrderBy(ro => ro.Order.Priority == OrderPriority.Urgent ? 0 : ro.Order.Priority == OrderPriority.Medium ? 1 : 2)
                    .ThenBy(ro => ro.Order.DeadlineAt)
                    .ToList();

                foreach (var ro in ordersForStop)
                {
                    var delivery = ro.DeliveryRecord;
                    items.Add(new AssignedStopDto(
                        ro.OrderId,
                        ro.Order.Description,
                        stop.Address,
                        stop.Zone?.Name ?? string.Empty,
                        ro.Order.Priority,
                        delivery is null ? "Pending" : delivery.Result.ToString(),
                        delivery?.Observations));
                }
            }

            result.Add(new AssignedRouteDto(
                route.Id,
                DateOnly.FromDateTime(route.ScheduledDate.UtcDateTime),
                route.DistributionCenter?.Name ?? $"Centro #{route.DistributionCenterId}",
                items));
        }

        return TypedResults.Ok(result);
    }

    [EndpointSummary("Record delivery result for an order in a route")]
    public static async Task<Results<Ok<AssignedStopDto>, NotFound<string>, Conflict<string>, BadRequest<string>>> RecordDelivery(
        int routeId,
        int orderId,
        RecordDeliveryRequest request,
        IApplicationDbContext context,
        IUser currentUser)
    {
        if (string.IsNullOrWhiteSpace(currentUser.Id))
        {
            return TypedResults.BadRequest("Usuario no autenticado.");
        }

        var route = await context.Routes
            .Include(r => r.Reviews)
            .Include(r => r.RouteOrders).ThenInclude(ro => ro.Order)
            .Include(r => r.RouteOrders).ThenInclude(ro => ro.DeliveryRecord)
            .Include(r => r.RouteStops).ThenInclude(rs => rs.Stop).ThenInclude(s => s.Zone)
            .FirstOrDefaultAsync(r => r.Id == routeId);

        if (route is null)
        {
            return TypedResults.NotFound("Ruta no encontrada.");
        }

        if (route.DeliveryPersonId != currentUser.Id)
        {
            return TypedResults.BadRequest("La ruta no está asignada al repartidor actual.");
        }

        if (!IsApproved(route))
        {
            return TypedResults.BadRequest("Solo se pueden registrar entregas en rutas aprobadas.");
        }

        var routeOrder = route.RouteOrders.FirstOrDefault(ro => ro.OrderId == orderId);
        if (routeOrder is null)
        {
            return TypedResults.NotFound("Parada/pedido no encontrado en la ruta.");
        }

        if (routeOrder.DeliveryRecord is not null)
        {
            return TypedResults.Conflict("Esta entrega ya fue registrada.");
        }

        if (request.Result == DeliveryResult.Failed && string.IsNullOrWhiteSpace(request.Observations))
        {
            return TypedResults.BadRequest("Indica el motivo de la entrega fallida.");
        }

        var record = new DeliveryRecord
        {
            RouteId = routeId,
            OrderId = orderId,
            DeliveredAt = DateTimeOffset.UtcNow,
            Result = request.Result,
            Observations = request.Observations,
        };

        context.DeliveryRecords.Add(record);
        await context.SaveChangesAsync(CancellationToken.None);

        var stop = route.RouteStops.Select(rs => rs.Stop).FirstOrDefault(s => s.Id == routeOrder.Order.StopId);

        var dto = new AssignedStopDto(
            routeOrder.OrderId,
            routeOrder.Order.Description,
            stop?.Address ?? string.Empty,
            stop?.Zone?.Name ?? string.Empty,
            routeOrder.Order.Priority,
            record.Result.ToString(),
            record.Observations);

        return TypedResults.Ok(dto);
    }

    [EndpointSummary("Delivery reports by center")]
    public static async Task<Ok<List<DeliveryCenterReportDto>>> GetDeliveryReportsByCenter(IApplicationDbContext context)
    {
        var routes = await context.Routes
            .AsNoTracking()
            .Include(r => r.DistributionCenter)
            .Include(r => r.Reviews)
            .Include(r => r.RouteOrders).ThenInclude(ro => ro.DeliveryRecord)
            .ToListAsync();

        var approved = routes.Where(IsApproved).ToList();
        var grouped = approved
            .GroupBy(r => new { r.DistributionCenterId, Name = r.DistributionCenter?.Name ?? $"Centro #{r.DistributionCenterId}" })
            .Select(g =>
            {
                var allRecords = g.SelectMany(r => r.RouteOrders).Select(ro => ro.DeliveryRecord).Where(d => d is not null).Cast<DeliveryRecord>().ToList();
                var totalOrders = g.SelectMany(r => r.RouteOrders).Count();
                var successful = allRecords.Count(d => d.Result == DeliveryResult.Successful);
                var failed = allRecords.Count(d => d.Result == DeliveryResult.Failed);
                var pending = totalOrders - allRecords.Count;
                return new DeliveryCenterReportDto(
                    g.Key.DistributionCenterId,
                    g.Key.Name,
                    g.Count(),
                    totalOrders,
                    successful,
                    failed,
                    pending);
            })
            .OrderBy(x => x.CenterName)
            .ToList();

        return TypedResults.Ok(grouped);
    }

    private static bool IsApproved(Smart_Routes.Domain.Entities.Route route)
    {
        if (route.Reviews is null || route.Reviews.Count == 0) return false;
        var latest = route.Reviews
            .OrderByDescending(r => r.Created)
            .ThenByDescending(r => r.Id)
            .FirstOrDefault();
        return latest?.Decision == ReviewDecision.Approved;
    }
}

// DTOs
public sealed record AssignedRouteDto(int RouteId, DateOnly ScheduledDate, string CenterName, List<AssignedStopDto> Stops);
public sealed record AssignedStopDto(int OrderId, string Description, string Address, string ZoneName, OrderPriority Priority, string Result, string? Observations);
public sealed record RecordDeliveryRequest(DeliveryResult Result, string? Observations);
public sealed record DeliveryCenterReportDto(int DistributionCenterId, string CenterName, int ApprovedRoutes, int TotalStops, int SuccessfulDeliveries, int FailedDeliveries, int PendingDeliveries);
