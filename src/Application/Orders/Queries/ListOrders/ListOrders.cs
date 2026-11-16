using Smart_Routes.Application.Common.Exceptions;
using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Application.Orders.Queries.GetOrderById;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Enums;

namespace Smart_Routes.Application.Orders.Queries.ListOrders;

/// <summary>Lists orders in centers accessible to the authenticated coordinator.</summary>
[Authorize(Roles = Roles.LogisticsCoordinator)]
public record ListOrdersQuery(
    int? DistributionCenterId = null,
    int? ZoneId = null,
    DeliveryType? DeliveryType = null,
    OrderPriority? Priority = null,
    OrderStatus? Status = null,
    int PageNumber = 1,
    int PageSize = 20) : IRequest<OrdersPageResponse>;

/// <summary>A page of orders and the total count matching the requested filters.</summary>
public sealed record OrdersPageResponse(
    IReadOnlyList<OrderResponse> Items,
    int PageNumber,
    int PageSize,
    int TotalCount);

/// <summary>Validates order filters and page bounds.</summary>
public sealed class ListOrdersQueryValidator : AbstractValidator<ListOrdersQuery>
{
    public ListOrdersQueryValidator()
    {
        RuleFor(query => query.DistributionCenterId)
            .GreaterThan(0)
            .When(query => query.DistributionCenterId.HasValue);

        RuleFor(query => query.ZoneId)
            .GreaterThan(0)
            .When(query => query.ZoneId.HasValue);

        RuleFor(query => query.DeliveryType)
            .Must(value => !value.HasValue || Enum.IsDefined(value.Value));

        RuleFor(query => query.Priority)
            .Must(value => !value.HasValue || Enum.IsDefined(value.Value));

        RuleFor(query => query.Status)
            .Must(value => !value.HasValue || Enum.IsDefined(value.Value));

        RuleFor(query => query.PageNumber)
            .GreaterThan(0);

        RuleFor(query => query.PageSize)
            .InclusiveBetween(1, 100);
    }
}

/// <summary>Retrieves a filtered page while restricting results to centers assigned to the coordinator.</summary>
public sealed class ListOrdersQueryHandler : IRequestHandler<ListOrdersQuery, OrdersPageResponse>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IUser _user;

    public ListOrdersQueryHandler(IOrderRepository orderRepository, IUser user)
    {
        _orderRepository = orderRepository;
        _user = user;
    }

    public async Task<OrdersPageResponse> Handle(ListOrdersQuery request, CancellationToken cancellationToken)
    {
        var coordinatorId = _user.Id ?? throw new UnauthorizedAccessException();
        var (orders, totalCount) = await _orderRepository.GetForCoordinatorAsync(
            coordinatorId,
            request.DistributionCenterId,
            request.ZoneId,
            request.DeliveryType,
            request.Priority,
            request.Status,
            request.PageNumber,
            request.PageSize,
            cancellationToken);

        var items = orders.Select(order => new OrderResponse(
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
            order.Stop.Address)).ToArray();

        return new OrdersPageResponse(items, request.PageNumber, request.PageSize, totalCount);
    }
}
