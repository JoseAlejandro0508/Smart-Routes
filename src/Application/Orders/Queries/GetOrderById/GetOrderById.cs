using Smart_Routes.Application.Common.Exceptions;
using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;

namespace Smart_Routes.Application.Orders.Queries.GetOrderById;

/// <summary>Query to retrieve an order by its identifier.</summary>
[Authorize(Roles = Roles.LogisticsCoordinator)]
public record GetOrderByIdQuery(int Id) : IRequest<OrderResponse>;

/// <summary>Order data exposed to API consumers.</summary>
public sealed record OrderResponse(
    int Id,
    string Description,
    string DeliveryType,
    string Priority,
    decimal WeightKg,
    DateOnly EntryDate,
    DateTimeOffset DeadlineAt,
    string Status,
    int DistributionCenterId,
    int StopId,
    string CenterName,
    string ZoneName,
    string Address);

/// <summary>Loads an order and verifies that the current coordinator can access its center.</summary>
public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, OrderResponse>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IUser _user;

    public GetOrderByIdQueryHandler(IOrderRepository orderRepository, IUser user)
    {
        _orderRepository = orderRepository;
        _user = user;
    }

    public async Task<OrderResponse> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByIdAsync(request.Id, cancellationToken);

        if (order is null)
        {
            throw new NotFoundException(request.Id.ToString(), nameof(Order));
        }

        var coordinatorId = _user.Id ?? throw new UnauthorizedAccessException();
        var isAuthorizedForCenter = await _orderRepository.IsCoordinatorAuthorizedForCenterAsync(
            coordinatorId,
            order.DistributionCenterId,
            cancellationToken);

        if (!isAuthorizedForCenter)
        {
            throw new ForbiddenAccessException();
        }

        return new OrderResponse(
            order.Id,
            order.Description,
            order.DeliveryType.ToString(),
            order.Priority.ToString(),
            order.WeightKg,
            order.EntryDate,
            order.DeadlineAt,
            order.Status.ToString(),
            order.DistributionCenterId,
            order.StopId,
            order.DistributionCenter.Name,
            order.Stop.Zone.Name,
            order.Stop.Address);
    }
}