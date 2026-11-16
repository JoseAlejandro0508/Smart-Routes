namespace Smart_Routes.Domain.Routing;

/// <summary>
/// Straight-line distance estimates, used when the road network service cannot be reached.
/// </summary>
public static class GeoDistance
{
    private const double EarthRadiusMeters = 6_371_000;

    /// <summary>
    /// Great-circle distance between two points (haversine formula).
    /// </summary>
    /// <param name="from">Start point.</param>
    /// <param name="to">End point.</param>
    /// <returns>Distance in meters.</returns>
    public static double HaversineMeters(GeoPoint from, GeoPoint to)
    {
        var dLat = ToRadians(to.Latitude - from.Latitude);
        var dLon = ToRadians(to.Longitude - from.Longitude);
        var lat1 = ToRadians(from.Latitude);
        var lat2 = ToRadians(to.Latitude);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1) * Math.Cos(lat2) * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        return 2 * EarthRadiusMeters * Math.Asin(Math.Min(1, Math.Sqrt(a)));
    }

    /// <summary>
    /// Estimates the road distance and travel time between every pair of points.
    /// </summary>
    /// <param name="points">Points of the matrix, in order.</param>
    /// <param name="roadFactor">How much longer roads are than a straight line (usually 1.2 to 1.4).</param>
    /// <param name="speedKmh">Average speed used to turn distance into time.</param>
    /// <returns>Distances in meters and durations in seconds, indexed [from, to].</returns>
    public static (double[,] Distances, double[,] Durations) EstimateMatrix(
        IReadOnlyList<GeoPoint> points,
        double roadFactor,
        double speedKmh)
    {
        var count = points.Count;
        var distances = new double[count, count];
        var durations = new double[count, count];
        var metersPerSecond = speedKmh * 1000 / 3600;

        for (var i = 0; i < count; i++)
        {
            for (var j = 0; j < count; j++)
            {
                if (i == j)
                {
                    continue;
                }

                var meters = HaversineMeters(points[i], points[j]) * roadFactor;
                distances[i, j] = meters;
                durations[i, j] = meters / metersPerSecond;
            }
        }

        return (distances, durations);
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;
}
