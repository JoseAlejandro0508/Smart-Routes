namespace Smart_Routes.Domain.Services;

/// <summary>Evaluates a balance parameter against a route's calculated metric.</summary>
public sealed class RouteBalanceParameterEvaluator
{
    private readonly RouteBalanceMetricCalculator _metricCalculator;

    public RouteBalanceParameterEvaluator(RouteBalanceMetricCalculator metricCalculator)
    {
        _metricCalculator = metricCalculator;
    }

    public RouteBalanceEvaluation Evaluate(
        BalanceParameter parameter,
        decimal appliedValue,
        RouteBalanceSnapshot route)
    {
        var actualValue = _metricCalculator.Calculate(
            parameter.Metric,
            route,
            parameter.TargetDeliveryType);

        var isSatisfied = parameter.Operator switch
        {
            ComparisonOperator.LessThanOrEqual => actualValue <= appliedValue,
            ComparisonOperator.GreaterThanOrEqual => actualValue >= appliedValue,
            ComparisonOperator.Equal => actualValue == appliedValue,
            _ => throw new ArgumentOutOfRangeException(
                nameof(parameter),
                parameter.Operator,
                "Unsupported comparison operator.")
        };

        return new RouteBalanceEvaluation(
            parameter.Metric,
            parameter.Operator,
            actualValue,
            appliedValue,
            isSatisfied);
    }
}
