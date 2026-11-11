using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;

namespace Smart_Routes.Domain.Factories;

/// <summary>Creates order entities with normalized descriptions and valid initial state.</summary>
public sealed class OrderFactory
{
    /// <summary>Builds a pending order from validated registration data.</summary>
    public Order Create(
        string description,
        DeliveryType deliveryType,
        OrderPriority priority,
        decimal weightKg,
        DateOnly entryDate,
        DateTimeOffset deadlineAt,
        string coordinatorId,
        int distributionCenterId,
        int stopId)
    {
        return new Order
        {
            Description = description.Trim(),
            DeliveryType = deliveryType,
            Priority = priority,
            WeightKg = weightKg,
            EntryDate = entryDate,
            DeadlineAt = deadlineAt,
            EntryCoordinatorId = coordinatorId,
            DistributionCenterId = distributionCenterId,
            StopId = stopId,
            Status = OrderStatus.Pending
        };
    }
}