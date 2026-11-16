namespace Smart_Routes.Domain.Routing;

/// <summary>
/// A point on the map in WGS84 coordinates, the system used by OpenStreetMap, OSRM and Leaflet.
/// </summary>
/// <param name="Longitude">Longitude in degrees, from -180 to 180.</param>
/// <param name="Latitude">Latitude in degrees, from -90 to 90.</param>
public readonly record struct GeoPoint(double Longitude, double Latitude)
{
    /// <summary>Returns whether both coordinates are inside their valid ranges.</summary>
    public bool IsValid =>
        Longitude is >= -180 and <= 180 &&
        Latitude is >= -90 and <= 90;

    /// <summary>
    /// Builds a point from nullable coordinates, or returns null when either one is missing.
    /// </summary>
    /// <param name="longitude">Longitude in degrees.</param>
    /// <param name="latitude">Latitude in degrees.</param>
    /// <returns>The point, or null if it cannot be built.</returns>
    public static GeoPoint? From(double? longitude, double? latitude) =>
        longitude is null || latitude is null ? null : new GeoPoint(longitude.Value, latitude.Value);
}
