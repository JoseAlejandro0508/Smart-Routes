namespace Smart_Routes.Domain.Services;

public sealed class OrderCountStrategy : IRouteBalanceMetricStrategy
{
    public BalanceMetric Metric => BalanceMetric.OrderCount;

    public decimal Calculate(RouteBalanceSnapshot route, DeliveryType? targetDeliveryType) =>
        route.OrderDeliveryTypes.Count;
}

public sealed class DeliveryTypeProportionStrategy : IRouteBalanceMetricStrategy
{
    public BalanceMetric Metric => BalanceMetric.DeliveryTypeProportion;

    public decimal Calculate(RouteBalanceSnapshot route, DeliveryType? targetDeliveryType)
    {
        if (targetDeliveryType is null)
        {
            throw new ArgumentException(
                "A target delivery type is required for the delivery type proportion metric.",
                nameof(targetDeliveryType));
        }

        if (route.OrderDeliveryTypes.Count == 0)
        {
            return 0m;
        }

        var matchingOrders = route.OrderDeliveryTypes.Count(deliveryType => deliveryType == targetDeliveryType);

        return (decimal)matchingOrders / route.OrderDeliveryTypes.Count;
    }
}

public sealed class ZoneCountStrategy : IRouteBalanceMetricStrategy
{
    public BalanceMetric Metric => BalanceMetric.ZoneCount;

    public decimal Calculate(RouteBalanceSnapshot route, DeliveryType? targetDeliveryType) =>
        route.DistinctZoneCount;
}

public sealed class TotalWeightStrategy : IRouteBalanceMetricStrategy
{
    public BalanceMetric Metric => BalanceMetric.TotalWeight;

    public decimal Calculate(RouteBalanceSnapshot route, DeliveryType? targetDeliveryType) =>
        route.TotalWeightKg;
}

public sealed class StopCountStrategy : IRouteBalanceMetricStrategy
{
    public BalanceMetric Metric => BalanceMetric.StopCount;

    public decimal Calculate(RouteBalanceSnapshot route, DeliveryType? targetDeliveryType) =>
        route.StopCount;
}
