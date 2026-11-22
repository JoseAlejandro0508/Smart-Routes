namespace Smart_Routes.Web.Auth;

/// <summary>Configuración de los tokens JWT emitidos por la API.</summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    /// <summary>Emisor del token.</summary>
    public string Issuer { get; set; } = "SmartRoutes";

    /// <summary>Audiencia del token.</summary>
    public string Audience { get; set; } = "SmartRoutes";

    /// <summary>Clave simétrica usada para firmar. En producción debe venir de un secreto.</summary>
    public string Key { get; set; } = "smart-routes-development-key-change-me-1234567890";

    /// <summary>Minutos de vida del token de acceso.</summary>
    public int AccessTokenMinutes { get; set; } = 15;

    /// <summary>Días de vida del token de refresco.</summary>
    public int RefreshTokenDays { get; set; } = 7;
}
