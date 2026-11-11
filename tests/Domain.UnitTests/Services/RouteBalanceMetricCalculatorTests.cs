using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;
using Smart_Routes.Domain.Services;
using NUnit.Framework;
using Shouldly;

namespace Smart_Routes.Domain.UnitTests.Services;

public class RouteBalanceMetricCalculatorTests
{
    private readonly RouteBalanceMetricCalculator _calculator = new(
    [
        new OrderCountStrategy(),
        new DeliveryTypeProportionStrategy(),
        new ZoneCountStrategy(),
        new TotalWeightStrategy(),
        new StopCountStrategy()
    ]);

    [Test]
    public void CalculateReturnsTheValueForTheSelectedMetric()
    {
        var route = new RouteBalanceSnapshot(
            [DeliveryType.Parcel, DeliveryType.Documents, DeliveryType.Parcel],
            2,
            8.5m,
            4);

        _calculator.Calculate(BalanceMetric.OrderCount, route).ShouldBe(3m);
        _calculator.Calculate(BalanceMetric.DeliveryTypeProportion, route, DeliveryType.Parcel).ShouldBe(2m / 3m);
        _calculator.Calculate(BalanceMetric.ZoneCount, route).ShouldBe(2m);
        _calculator.Calculate(BalanceMetric.TotalWeight, route).ShouldBe(8.5m);
        _calculator.Calculate(BalanceMetric.StopCount, route).ShouldBe(4m);
    }

    [Test]
    public void CalculateReturnsZeroProportionForAnEmptyRoute()
    {
        var route = new RouteBalanceSnapshot([], 0, 0m, 0);

        _calculator.Calculate(BalanceMetric.DeliveryTypeProportion, route, DeliveryType.Parcel).ShouldBe(0m);
    }

    [Test]
    public void CalculateRequiresTargetDeliveryTypeForProportion()
    {
        var route = new RouteBalanceSnapshot([DeliveryType.Parcel], 1, 2m, 1);

        Should.Throw<ArgumentException>(() =>
            _calculator.Calculate(BalanceMetric.DeliveryTypeProportion, route));
    }
}
