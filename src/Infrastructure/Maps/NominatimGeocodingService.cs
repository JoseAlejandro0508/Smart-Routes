using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Domain.Routing;

namespace Smart_Routes.Infrastructure.Maps;

/// <summary>
/// Geocoding with Nominatim, the OpenStreetMap address search.
/// </summary>
/// <remarks>
/// The public Nominatim server allows at most one request per second, so requests are spaced out
/// and results are cached. A failure returns null instead of throwing, so a stop can still be saved
/// without coordinates and located later.
/// </remarks>
public sealed class NominatimGeocodingService : IGeocodingService
{
    private static readonly SemaphoreSlim Throttle = new(1, 1);
    private static DateTimeOffset _lastRequest = DateTimeOffset.MinValue;

    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;
    private readonly MapServicesOptions _options;
    private readonly ILogger<NominatimGeocodingService> _logger;

    /// <summary>Creates the service.</summary>
    public NominatimGeocodingService(
        HttpClient http,
        IMemoryCache cache,
        IOptions<MapServicesOptions> options,
        ILogger<NominatimGeocodingService> logger)
    {
        _http = http;
        _cache = cache;
        _options = options.Value;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<GeoPoint?> GeocodeAsync(string address, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(address))
        {
            return null;
        }

        var normalized = address.Trim();
        var key = $"nominatim:{_options.GeocodingCountryCodes}:{normalized.ToLowerInvariant()}";
        if (_cache.TryGetValue(key, out GeoPoint? cached))
        {
            return cached;
        }

        await Throttle.WaitAsync(cancellationToken);
        try
        {
            var wait = _lastRequest.AddSeconds(1) - DateTimeOffset.UtcNow;
            if (wait > TimeSpan.Zero)
            {
                await Task.Delay(wait, cancellationToken);
            }

            var url = $"{_options.NominatimBaseUrl.TrimEnd('/')}/search?format=jsonv2&limit=1&q={Uri.EscapeDataString(normalized)}";
            if (!string.IsNullOrWhiteSpace(_options.GeocodingCountryCodes))
            {
                url += $"&countrycodes={Uri.EscapeDataString(_options.GeocodingCountryCodes)}";
            }

            using var response = await _http.GetAsync(url, cancellationToken);
            _lastRequest = DateTimeOffset.UtcNow;
            response.EnsureSuccessStatusCode();

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

            GeoPoint? point = null;
            if (document.RootElement.GetArrayLength() > 0)
            {
                var first = document.RootElement[0];
                point = new GeoPoint(
                    double.Parse(first.GetProperty("lon").GetString()!, CultureInfo.InvariantCulture),
                    double.Parse(first.GetProperty("lat").GetString()!, CultureInfo.InvariantCulture));
            }

            _cache.Set(key, point, TimeSpan.FromMinutes(_options.CacheMinutes));
            return point;
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "Geocoding failed for address {Address}.", normalized);
            return null;
        }
        finally
        {
            Throttle.Release();
        }
    }
}
