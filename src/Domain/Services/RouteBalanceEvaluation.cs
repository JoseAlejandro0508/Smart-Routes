namespace Smart_Routes.Domain.Services;

/// <summary>Result of comparing a route metric with the value applied to its route.</summary>
public sealed record RouteBalanceEvaluation(
    BalanceMetric Metric,
    ComparisonOperator Operator,
    decimal ActualValue,
    decimal AppliedValue,
    bool IsSatisfied);
