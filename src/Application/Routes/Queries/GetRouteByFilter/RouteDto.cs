using Smart_Routes.Application.Common.Models;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.Routes.Commands.GetRouteByFilter;
public class RouteDto
{
    public int Id { get; set; }
    public DateTimeOffset ScheduledDate { get; set; }
    public string GeneratorCoordinatorId { get; set; } = string.Empty;
    public int DistributionCenterId { get; set; }
    public string? DeliveryPersonId { get; set; }
    public int BalanceCriterionId { get; set; }
    public List<Order> OrdersOrdered { get; set; } = [];
    public BalanceCriterionWithParametersDto? BalanceCriterion { get; set; }
    public DateTimeOffset Created{get; set; }
}
