using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Domain.Routing;

namespace Smart_Routes.Infrastructure.Maps;

/// <summary>
/// Road network backed by OSRM, which routes on the OpenStreetMap street graph.
/// </summary>
/// <remarks>
/// Uses the <c>table</c> service for distance matrices and the <c>route</c> service for paths.
/// When OSRM fails or times out, it falls back to a straight-line estimate so that route
/// generation still works without connection; the result says which source was used.
/// </remarks>
public sealed class OsrmRoadNetworkService : IRoadNetworkService
{
    /// <summary>Most coordinates the public OSRM server accepts in one request.</summary>
    private const int MaxCoordinates = 100;

    private const string OsrmSource = "osrm";
    private const string EstimatedSource = "estimated";

    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;
    private readonly MapServicesOptions _options;
    private readonly ILogger<OsrmRoadNetworkService> _logger;

    /// <summary>Creates the service.</summary>
    public OsrmRoadNetworkService(
        HttpClient http,
        IMemoryCache cache,
        IOptions<MapServicesOptions> options,
        ILogger<OsrmRoadNetworkService> logger)
    {
        _http = http;
        _cache = cache;
        _options = options.Value;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<RoadMatrix> GetMatrixAsync(IReadOnlyList<GeoPoint> points, CancellationToken cancellationToken)
    {
        if (points.Count < 2 || points.Count > MaxCoordinates)
        {
            return EstimateMatrix(points);
        }

        var key = $"osrm:table:{Coordinates(points)}";
        if (_cache.TryGetValue(key, out RoadMatrix? cached) && cached is not null)
        {
            return cached;
        }

        try
        {
            var url = $"{_options.OsrmBaseUrl.TrimEnd('/')}/table/v1/{_options.OsrmProfile}/{Coordinates(points)}?annotations=distance,duration";
            using var document = await GetJsonAsync(url, cancellationToken);
            var root = document.RootElement;

            if (root.GetProperty("code").GetString() != "Ok")
            {
                throw new InvalidOperationException($"OSRM answered {root.GetProperty("code").GetString()}.");
            }

            var estimate = EstimateMatrix(points);
            var distances = ReadMatrix(root.GetProperty("distances"), estimate.DistancesMeters);
            var durations = ReadMatrix(root.GetProperty("durations"), estimate.DurationsSeconds);

            var matrix = new RoadMatrix(distances, durations, OsrmSource);
            _cache.Set(key, matrix, TimeSpan.FromMinutes(_options.CacheMinutes));
            return matrix;
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "OSRM table request failed; using straight-line estimates.");
            return EstimateMatrix(points);
        }
    }

    /// <inheritdoc />
    public async Task<RoadPath> GetPathAsync(IReadOnlyList<GeoPoint> points, CancellationToken cancellationToken)
    {
        if (points.Count < 2 || points.Count > MaxCoordinates)
        {
            return EstimatePath(points);
        }

        var key = $"osrm:route:{Coordinates(points)}";
        if (_cache.TryGetValue(key, out RoadPath? cached) && cached is not null)
        {
            return cached;
        }

        try
        {
            var url = $"{_options.OsrmBaseUrl.TrimEnd('/')}/route/v1/{_options.OsrmProfile}/{Coordinates(points)}?overview=full&geometries=geojson";
            using var document = await GetJsonAsync(url, cancellationToken);
            var root = document.RootElement;

            if (root.GetProperty("code").GetString() != "Ok")
            {
                throw new InvalidOperationException($"OSRM answered {root.GetProperty("code").GetString()}.");
            }

            var route = root.GetProperty("routes")[0];
            var geometry = route.GetProperty("geometry").GetProperty("coordinates")
                .EnumerateArray()
                .Select(pair => new GeoPoint(pair[0].GetDouble(), pair[1].GetDouble()))
                .ToList();

            var path = new RoadPath(
                geometry,
                route.GetProperty("distance").GetDouble(),
                route.GetProperty("duration").GetDouble(),
                OsrmSource);

            _cache.Set(key, path, TimeSpan.FromMinutes(_options.CacheMinutes));
            return path;
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "OSRM route request failed; drawing straight lines.");
            return EstimatePath(points);
        }
    }

    private async Task<JsonDocument> GetJsonAsync(string url, CancellationToken cancellationToken)
    {
        using var response = await _http.GetAsync(url, cancellationToken);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        return await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
    }

    private RoadMatrix EstimateMatrix(IReadOnlyList<GeoPoint> points)
    {
        var (distances, durations) = GeoDistance.EstimateMatrix(points, _options.FallbackRoadFactor, _options.FallbackSpeedKmh);
        return new RoadMatrix(distances, durations, EstimatedSource);
    }

    private RoadPath EstimatePath(IReadOnlyList<GeoPoint> points)
    {
        var meters = 0d;
        for (var i = 1; i < points.Count; i++)
        {
            meters += GeoDistance.HaversineMeters(points[i - 1], points[i]) * _options.FallbackRoadFactor;
        }

        var seconds = meters / (_options.FallbackSpeedKmh * 1000 / 3600);
        return new RoadPath(points.ToList(), meters, seconds, EstimatedSource);
    }

    /// <summary>Reads an OSRM matrix; cells OSRM cannot route (null) keep the estimated value.</summary>
    private static double[,] ReadMatrix(JsonElement rows, double[,] fallback)
    {
        var size = fallback.GetLength(0);
        var result = new double[size, size];
        var i = 0;

        foreach (var row in rows.EnumerateArray())
        {
            var j = 0;
            foreach (var cell in row.EnumerateArray())
            {
                result[i, j] = cell.ValueKind == JsonValueKind.Number ? cell.GetDouble() : fallback[i, j];
                j++;
            }

            i++;
        }

        return result;
    }

    /// <summary>Formats points the way OSRM expects: <c>lon,lat;lon,lat</c>.</summary>
    private static string Coordinates(IEnumerable<GeoPoint> points) =>
        string.Join(';', points.Select(p => string.Create(
            CultureInfo.InvariantCulture,
            $"{Math.Round(p.Longitude, 6)},{Math.Round(p.Latitude, 6)}")));
}
