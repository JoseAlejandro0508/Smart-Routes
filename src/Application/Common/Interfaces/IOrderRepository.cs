using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.Common.Interfaces;

/// <summary>Provides persistence operations required by order use cases.</summary>
public interface IOrderRepository
{
    /// <summary>Checks whether a coordinator is assigned to the specified center.</summary>
    Task<bool> IsCoordinatorAuthorizedForCenterAsync(string coordinatorId, int centerId, CancellationToken cancellationToken);

    /// <summary>Finds a stop by its identifier.</summary>
    Task<Stop?> GetStopByIdAsync(int stopId, CancellationToken cancellationToken);

    /// <summary>Finds a stop by its normalized address and zone.</summary>
    Task<Stop?> GetStopByAddressAndZoneAsync(string address, int zoneId, CancellationToken cancellationToken);

    /// <summary>Checks whether a center covers the specified zone.</summary>
    Task<bool> DoesCenterCoverZoneAsync(int centerId, int zoneId, CancellationToken cancellationToken);

    /// <summary>Checks the business key used to prevent duplicate orders.</summary>
    Task<bool> ExistsAsync(int centerId, int stopId, Domain.Enums.DeliveryType deliveryType, string description, DateOnly entryDate, CancellationToken cancellationToken);

    /// <summary>Adds a new order to the persistence context.</summary>
    void Add(Order order);

    /// <summary>Finds an order by its identifier.</summary>
    Task<Order?> GetByIdAsync(int orderId, CancellationToken cancellationToken);

    /// <summary>Returns a page of orders visible to a coordinator and the total matching count.</summary>
    Task<(IReadOnlyList<Order> Orders, int TotalCount)> GetForCoordinatorAsync(
        string coordinatorId,
        int? centerId,
        int? zoneId,
        Domain.Enums.DeliveryType? deliveryType,
        Domain.Enums.OrderPriority? priority,
        Domain.Enums.OrderStatus? status,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    /// <summary>Persists pending changes and returns the number of affected records.</summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}