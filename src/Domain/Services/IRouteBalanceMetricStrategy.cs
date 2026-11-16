namespace Smart_Routes.Domain.Services;

/// <summary>Calculates one kind of route balance metric.</summary>
public interface IRouteBalanceMetricStrategy
{
    BalanceMetric Metric { get; }

    decimal Calculate(RouteBalanceSnapshot route, DeliveryType? targetDeliveryType);
}
