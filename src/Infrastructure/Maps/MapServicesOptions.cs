namespace Smart_Routes.Infrastructure.Maps;

/// <summary>
/// Settings of the map services, read from the <c>Maps</c> section of the configuration.
/// </summary>
/// <remarks>
/// The defaults use the public OpenStreetMap services, which need no API key. The OSRM demo server
/// is meant for light use; for heavier use, run OSRM in a container and point <see cref="OsrmBaseUrl"/> to it.
/// </remarks>
public sealed class MapServicesOptions
{
    /// <summary>Name of the configuration section.</summary>
    public const string SectionName = "Maps";

    /// <summary>Base URL of the OSRM routing server, which computes routes on the OpenStreetMap road graph.</summary>
    public string OsrmBaseUrl { get; set; } = "https://router.project-osrm.org";

    /// <summary>OSRM profile: <c>driving</c>, <c>cycling</c> or <c>foot</c>.</summary>
    public string OsrmProfile { get; set; } = "driving";

    /// <summary>Base URL of the Nominatim geocoding server.</summary>
    public string NominatimBaseUrl { get; set; } = "https://nominatim.openstreetmap.org";

    /// <summary>Comma-separated ISO country codes that limit geocoding results, for example <c>cu</c>. Empty means any country.</summary>
    public string GeocodingCountryCodes { get; set; } = "cu";

    /// <summary>User-Agent sent to the OpenStreetMap services, which require one that identifies the application.</summary>
    public string UserAgent { get; set; } = "SmartRoutes/1.0 (proyecto universitario)";

    /// <summary>Maximum time to wait for one request, in seconds.</summary>
    public int TimeoutSeconds { get; set; } = 25;

    /// <summary>How much longer roads are than a straight line, used for the fallback estimate.</summary>
    public double FallbackRoadFactor { get; set; } = 1.3;

    /// <summary>Average speed in km/h, used for the fallback estimate.</summary>
    public double FallbackSpeedKmh { get; set; } = 30;

    /// <summary>How long responses are cached, in minutes.</summary>
    public int CacheMinutes { get; set; } = 60;
}
