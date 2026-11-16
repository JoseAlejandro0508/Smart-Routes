using NUnit.Framework;
using Shouldly;
using Smart_Routes.Domain.Routing;

namespace Smart_Routes.Domain.UnitTests.Routing;

public class GeoDistanceTests
{
    [Test]
    public void HaversineMatchesAKnownDistance()
    {
        // Capitolio de La Habana to the Hotel Nacional: about 2.4 km in a straight line.
        var capitolio = new GeoPoint(-82.3597, 23.1352);
        var nacional = new GeoPoint(-82.3820, 23.1426);

        GeoDistance.HaversineMeters(capitolio, nacional).ShouldBe(2_430, tolerance: 150);
    }

    [Test]
    public void HaversineIsZeroForTheSamePoint()
    {
        var point = new GeoPoint(-82.38, 23.13);

        GeoDistance.HaversineMeters(point, point).ShouldBe(0, tolerance: 1e-6);
    }

    [Test]
    public void EstimateMatrixAppliesRoadFactorAndSpeed()
    {
        var points = new[] { new GeoPoint(-82.36, 23.13), new GeoPoint(-82.38, 23.14) };
        var straight = GeoDistance.HaversineMeters(points[0], points[1]);

        var (distances, durations) = GeoDistance.EstimateMatrix(points, roadFactor: 1.5, speedKmh: 36);

        distances[0, 0].ShouldBe(0);
        distances[0, 1].ShouldBe(straight * 1.5, tolerance: 1e-6);
        durations[0, 1].ShouldBe(straight * 1.5 / 10, tolerance: 1e-6); // 36 km/h = 10 m/s
    }

    [TestCase(-82.38, 23.13, true)]
    [TestCase(-190, 23.13, false)]
    [TestCase(-82.38, 95, false)]
    public void IsValidChecksRanges(double longitude, double latitude, bool expected)
    {
        new GeoPoint(longitude, latitude).IsValid.ShouldBe(expected);
    }

    [Test]
    public void FromReturnsNullWhenACoordinateIsMissing()
    {
        GeoPoint.From(null, 23.1).ShouldBeNull();
        GeoPoint.From(-82.3, 23.1).ShouldBe(new GeoPoint(-82.3, 23.1));
    }
}
