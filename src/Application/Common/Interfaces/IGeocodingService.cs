using Smart_Routes.Domain.Routing;

namespace Smart_Routes.Application.Common.Interfaces;

/// <summary>Turns a postal address into map coordinates.</summary>
public interface IGeocodingService
{
    /// <summary>Finds the coordinates of an address.</summary>
    /// <param name="address">Address as the user wrote it.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The point, or null if the address was not found or the service is unavailable.</returns>
    Task<GeoPoint?> GeocodeAsync(string address, CancellationToken cancellationToken);
}
