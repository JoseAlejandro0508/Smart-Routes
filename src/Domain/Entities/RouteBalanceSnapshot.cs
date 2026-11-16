namespace Smart_Routes.Domain.Entities;

/// <summary>Route data needed to calculate its balance metrics.</summary>
public sealed record RouteBalanceSnapshot(
    IReadOnlyCollection<DeliveryType> OrderDeliveryTypes,
    int DistinctZoneCount,
    decimal TotalWeightKg,
    int StopCount);
