namespace Smart_Routes.Infrastructure.Data.Configurations;

/// <summary>
/// Builds SQL check constraints that restrict enum columns to their closed domains (informe 3.2).
/// </summary>
/// <remarks>
/// Enums are stored as integers, so without these checks the database would accept values
/// outside the catalog when rows are written by SQL instead of by the application.
/// </remarks>
internal static class DomainCheckConstraints
{
    /// <summary>
    /// Returns a condition that accepts only the defined values of <typeparamref name="TEnum"/>.
    /// </summary>
    /// <typeparam name="TEnum">Enum stored in the column.</typeparam>
    /// <param name="column">Column name, without brackets.</param>
    /// <param name="nullable">Whether NULL is also a valid value.</param>
    /// <returns>The SQL condition for <c>HasCheckConstraint</c>.</returns>
    public static string InEnum<TEnum>(string column, bool nullable = false) where TEnum : struct, Enum
    {
        var values = string.Join(", ", Enum.GetValues<TEnum>().Select(v => Convert.ToInt32(v)));
        var condition = $"[{column}] IN ({values})";
        return nullable ? $"[{column}] IS NULL OR {condition}" : condition;
    }

    /// <summary>
    /// Returns a condition for optional WGS84 coordinates: both null, or longitude in [-180, 180]
    /// and latitude in [-90, 90].
    /// </summary>
    /// <param name="longitudeColumn">Longitude column, without brackets.</param>
    /// <param name="latitudeColumn">Latitude column, without brackets.</param>
    /// <returns>The SQL condition for <c>HasCheckConstraint</c>.</returns>
    public static string Coordinates(string longitudeColumn, string latitudeColumn) =>
        $"([{longitudeColumn}] IS NULL AND [{latitudeColumn}] IS NULL) OR " +
        $"([{longitudeColumn}] BETWEEN -180 AND 180 AND [{latitudeColumn}] BETWEEN -90 AND 90)";
}
