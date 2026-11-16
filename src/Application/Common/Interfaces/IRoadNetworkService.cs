using Smart_Routes.Domain.Routing;

namespace Smart_Routes.Application.Common.Interfaces;

/// <summary>
/// Distances, travel times and paths on the road network (the street graph of the map).
/// </summary>
public interface IRoadNetworkService
{
    /// <summary>
    /// Road distance and travel time between every pair of points.
    /// </summary>
    /// <param name="points">Points of the matrix, in order.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The matrices, indexed [from, to] in the order of <paramref name="points"/>.</returns>
    Task<RoadMatrix> GetMatrixAsync(IReadOnlyList<GeoPoint> points, CancellationToken cancellationToken);

    /// <summary>
    /// Path along the roads that visits the points in the given order.
    /// </summary>
    /// <param name="points">Points to visit, in order.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The path geometry, its length and its duration.</returns>
    Task<RoadPath> GetPathAsync(IReadOnlyList<GeoPoint> points, CancellationToken cancellationToken);
}

/// <summary>Distances and travel times between points.</summary>
/// <param name="DistancesMeters">Distance in meters, indexed [from, to].</param>
/// <param name="DurationsSeconds">Travel time in seconds, indexed [from, to].</param>
/// <param name="Source">Where the values come from: <c>osrm</c> (real roads) or <c>estimated</c> (straight line).</param>
public sealed record RoadMatrix(double[,] DistancesMeters, double[,] DurationsSeconds, string Source);

/// <summary>A path along the roads.</summary>
/// <param name="Geometry">Points of the drawn line, in order.</param>
/// <param name="DistanceMeters">Total length in meters.</param>
/// <param name="DurationSeconds">Total travel time in seconds.</param>
/// <param name="Source">Where the values come from: <c>osrm</c> (real roads) or <c>estimated</c> (straight line).</param>
public sealed record RoadPath(IReadOnlyList<GeoPoint> Geometry, double DistanceMeters, double DurationSeconds, string Source);
