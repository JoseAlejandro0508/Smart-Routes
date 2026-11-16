using NUnit.Framework;
using Shouldly;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;
using Smart_Routes.Domain.Routing;
using Smart_Routes.Domain.Services;

namespace Smart_Routes.Domain.UnitTests.Routing;

public class RouteOrderSelectorTests
{
    private static readonly DateTimeOffset Today = new(2026, 11, 20, 12, 0, 0, TimeSpan.Zero);

    private readonly RouteOrderSelector _selector = new(new RouteBalanceParameterEvaluator(
        new RouteBalanceMetricCalculator(
        [
            new OrderCountStrategy(),
            new DeliveryTypeProportionStrategy(),
            new ZoneCountStrategy(),
            new TotalWeightStrategy(),
            new StopCountStrategy()
        ])));

    [Test]
    public void SelectTakesMostUrgentOrdersFirst()
    {
        var candidates = new[]
        {
            Candidate(1, priority: OrderPriority.Low),
            Candidate(2, priority: OrderPriority.Urgent),
            Candidate(3, priority: OrderPriority.Medium)
        };

        var result = _selector.Select(candidates, [Parameter(BalanceMetric.OrderCount, ComparisonOperator.LessThanOrEqual, 2)]);

        result.Selected.Select(c => c.OrderId).ShouldBe([2, 3]);
        result.SatisfiesCriterion.ShouldBeTrue();
    }

    [Test]
    public void SelectBreaksPriorityTiesByDeadline()
    {
        var candidates = new[]
        {
            Candidate(1, deadline: Today.AddDays(3)),
            Candidate(2, deadline: Today.AddDays(1))
        };

        var result = _selector.Select(candidates, [Parameter(BalanceMetric.OrderCount, ComparisonOperator.LessThanOrEqual, 1)]);

        result.Selected.Single().OrderId.ShouldBe(2);
    }

    [Test]
    public void SelectNeverExceedsTheWeightLimit()
    {
        var candidates = new[]
        {
            Candidate(1, weight: 60, priority: OrderPriority.Urgent),
            Candidate(2, weight: 50, priority: OrderPriority.Medium),
            Candidate(3, weight: 30, priority: OrderPriority.Low)
        };

        var result = _selector.Select(candidates, [Parameter(BalanceMetric.TotalWeight, ComparisonOperator.LessThanOrEqual, 100)]);

        // 60 + 50 would pass 100, so the second order is skipped and the third one fits.
        result.Selected.Select(c => c.OrderId).ShouldBe([1, 3]);
        result.Selected.Sum(c => c.WeightKg).ShouldBeLessThanOrEqualTo(100);
    }

    [Test]
    public void SelectLimitsZonesAndStops()
    {
        var candidates = new[]
        {
            Candidate(1, stopId: 10, zoneId: 1, priority: OrderPriority.Urgent),
            Candidate(2, stopId: 10, zoneId: 1, priority: OrderPriority.Urgent),
            Candidate(3, stopId: 20, zoneId: 2, priority: OrderPriority.Medium),
            Candidate(4, stopId: 30, zoneId: 1, priority: OrderPriority.Low)
        };

        var result = _selector.Select(candidates,
        [
            Parameter(BalanceMetric.ZoneCount, ComparisonOperator.LessThanOrEqual, 1),
            Parameter(BalanceMetric.StopCount, ComparisonOperator.LessThanOrEqual, 2)
        ]);

        // Order 3 would add a second zone; orders 1, 2 and 4 stay in zone 1 and use two stops.
        result.Selected.Select(c => c.OrderId).ShouldBe([1, 2, 4]);
    }

    [Test]
    public void SelectCapsTheProportionOfADeliveryType()
    {
        var candidates = new[]
        {
            Candidate(1, type: DeliveryType.Perishable, priority: OrderPriority.Urgent),
            Candidate(2, type: DeliveryType.Perishable, priority: OrderPriority.Urgent),
            Candidate(3, type: DeliveryType.Parcel, priority: OrderPriority.Medium),
            Candidate(4, type: DeliveryType.Parcel, priority: OrderPriority.Low)
        };

        var result = _selector.Select(candidates,
            [Parameter(BalanceMetric.DeliveryTypeProportion, ComparisonOperator.LessThanOrEqual, 0.5m, DeliveryType.Perishable)]);

        // The first perishable order alone is 100 %, but other orders can lower it; the end result respects the cap.
        result.Evaluations.Single().ActualValue.ShouldBeLessThanOrEqualTo(0.5m);
        result.SatisfiesCriterion.ShouldBeTrue();
    }

    [Test]
    public void SelectPutsRequiredDeliveryTypesFirst()
    {
        var candidates = new[]
        {
            Candidate(1, type: DeliveryType.Parcel, priority: OrderPriority.Urgent),
            Candidate(2, type: DeliveryType.Documents, priority: OrderPriority.Low),
            Candidate(3, type: DeliveryType.Parcel, priority: OrderPriority.Medium)
        };

        var result = _selector.Select(candidates,
            [Parameter(BalanceMetric.DeliveryTypeProportion, ComparisonOperator.GreaterThanOrEqual, 0.5m, DeliveryType.Documents)]);

        result.Selected.First().OrderId.ShouldBe(2);
        result.SatisfiesCriterion.ShouldBeTrue();
    }

    [Test]
    public void SelectReportsLowerLimitsItCannotReach()
    {
        var result = _selector.Select([Candidate(1)], [Parameter(BalanceMetric.OrderCount, ComparisonOperator.GreaterThanOrEqual, 5)]);

        result.Selected.Count.ShouldBe(1);
        result.SatisfiesCriterion.ShouldBeFalse();
        result.Evaluations.Single().ActualValue.ShouldBe(1);
    }

    [Test]
    public void SelectWithoutParametersTakesEveryCandidate()
    {
        var result = _selector.Select([Candidate(1), Candidate(2), Candidate(3)], []);

        result.Selected.Count.ShouldBe(3);
        result.Evaluations.ShouldBeEmpty();
    }

    private static RouteCandidate Candidate(
        int id,
        int stopId = 0,
        int zoneId = 1,
        decimal weight = 1,
        DeliveryType type = DeliveryType.Parcel,
        OrderPriority priority = OrderPriority.Medium,
        DateTimeOffset? deadline = null) =>
        new(id, stopId == 0 ? id * 10 : stopId, zoneId, weight, type, priority, deadline ?? Today.AddDays(1));

    private static BalanceParameter Parameter(
        BalanceMetric metric,
        ComparisonOperator comparison,
        decimal value,
        DeliveryType? target = null) =>
        new()
        {
            Name = $"{metric} {comparison} {value}",
            Metric = metric,
            Operator = comparison,
            AppliedValue = value,
            TargetDeliveryType = target
        };
}
