namespace Smart_Routes.Domain.Services;

/// <summary>Selects the strategy that calculates a requested route balance metric.</summary>
public sealed class RouteBalanceMetricCalculator
{
    private readonly IReadOnlyDictionary<BalanceMetric, IRouteBalanceMetricStrategy> _strategies;

    public RouteBalanceMetricCalculator(IEnumerable<IRouteBalanceMetricStrategy> strategies)
    {
        _strategies = strategies.ToDictionary(strategy => strategy.Metric);
    }

    public decimal Calculate(
        BalanceMetric metric,
        RouteBalanceSnapshot route,
        DeliveryType? targetDeliveryType = null)
    {
        if (!_strategies.TryGetValue(metric, out var strategy))
        {
            throw new ArgumentOutOfRangeException(nameof(metric), metric, "No strategy is registered for this metric.");
        }

        return strategy.Calculate(route, targetDeliveryType);
    }
}
