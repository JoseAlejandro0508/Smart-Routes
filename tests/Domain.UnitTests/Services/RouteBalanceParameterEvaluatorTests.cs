using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;
using Smart_Routes.Domain.Services;
using NUnit.Framework;
using Shouldly;

namespace Smart_Routes.Domain.UnitTests.Services;

public class RouteBalanceParameterEvaluatorTests
{
    private readonly RouteBalanceParameterEvaluator _evaluator = new(new RouteBalanceMetricCalculator(
    [
        new OrderCountStrategy(),
        new DeliveryTypeProportionStrategy(),
        new ZoneCountStrategy(),
        new TotalWeightStrategy(),
        new StopCountStrategy()
    ]));

    [TestCase(ComparisonOperator.LessThanOrEqual, 3, true)]
    [TestCase(ComparisonOperator.LessThanOrEqual, 1, false)]
    [TestCase(ComparisonOperator.GreaterThanOrEqual, 2, true)]
    [TestCase(ComparisonOperator.GreaterThanOrEqual, 3, false)]
    [TestCase(ComparisonOperator.Equal, 2, true)]
    [TestCase(ComparisonOperator.Equal, 3, false)]
    public void EvaluateComparesCalculatedMetricWithAppliedValue(
        ComparisonOperator comparisonOperator,
        decimal appliedValue,
        bool expectedIsSatisfied)
    {
        var parameter = new BalanceParameter
        {
            Metric = BalanceMetric.OrderCount,
            Operator = comparisonOperator
        };
        var route = new RouteBalanceSnapshot(
            [DeliveryType.Parcel, DeliveryType.Documents],
            2,
            5m,
            2);

        var result = _evaluator.Evaluate(parameter, appliedValue, route);

        result.Metric.ShouldBe(BalanceMetric.OrderCount);
        result.Operator.ShouldBe(comparisonOperator);
        result.ActualValue.ShouldBe(2m);
        result.AppliedValue.ShouldBe(appliedValue);
        result.IsSatisfied.ShouldBe(expectedIsSatisfied);
    }

    [Test]
    public void EvaluateUsesTargetDeliveryTypeForProportion()
    {
        var parameter = new BalanceParameter
        {
            Metric = BalanceMetric.DeliveryTypeProportion,
            Operator = ComparisonOperator.GreaterThanOrEqual,
            TargetDeliveryType = DeliveryType.Parcel
        };
        var route = new RouteBalanceSnapshot(
            [DeliveryType.Parcel, DeliveryType.Documents, DeliveryType.Parcel, DeliveryType.Documents],
            2,
            10m,
            3);

        var result = _evaluator.Evaluate(parameter, 0.5m, route);

        result.ActualValue.ShouldBe(0.5m);
        result.IsSatisfied.ShouldBeTrue();
    }

    [Test]
    public void EvaluateRejectsUnsupportedComparisonOperator()
    {
        var parameter = new BalanceParameter
        {
            Metric = BalanceMetric.OrderCount,
            Operator = (ComparisonOperator)99
        };
        var route = new RouteBalanceSnapshot([DeliveryType.Parcel], 1, 1m, 1);

        Should.Throw<ArgumentOutOfRangeException>(() =>
            _evaluator.Evaluate(parameter, 1m, route));
    }
}
