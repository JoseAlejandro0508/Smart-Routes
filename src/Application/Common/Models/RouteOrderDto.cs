using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;

namespace Smart_Routes.Application.Common.Models;

/// <summary>
/// An order inside a route, without navigation properties.
/// </summary>
/// <remarks>
/// Returning the <see cref="Order"/> entity directly makes JSON serialization loop forever
/// (order → stop → orders → …), so route endpoints return this flat shape instead.
/// </remarks>
public sealed record RouteOrderDto(
    int Id,
    string Description,
    DeliveryType DeliveryType,
    OrderPriority Priority,
    decimal WeightKg,
    DateTimeOffset DeadlineAt,
    OrderStatus Status,
    int StopId,
    string StopAddress)
{
    /// <summary>Copies the order data; the stop must be loaded.</summary>
    /// <param name="order">Order with its stop included.</param>
    /// <returns>The flat order.</returns>
    public static RouteOrderDto From(Order order) =>
        new(
            order.Id,
            order.Description,
            order.DeliveryType,
            order.Priority,
            order.WeightKg,
            order.DeadlineAt,
            order.Status,
            order.StopId,
            order.Stop?.Address ?? string.Empty);
}

/// <summary>Result of generating a route.</summary>
/// <param name="RouteId">Identifier of the new route, used to ask for its map.</param>
/// <param name="Orders">Orders of the route, grouped by stop in visiting order.</param>
public sealed record GeneratedRouteDto(int RouteId, IReadOnlyList<RouteOrderDto> Orders);
