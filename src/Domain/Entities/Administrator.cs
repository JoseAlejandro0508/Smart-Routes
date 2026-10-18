namespace Smart_Routes.Domain.Entities;

/// <summary>
/// ADMINISTRADOR (subtipo de USUARIO). Responsable de la integridad global y la
/// parametrización de la plataforma.
/// </summary>
public class Administrator : BaseUserProfile
{
    /// <summary>nivel_acceso.</summary>
    public AdminAccessLevels AccessLevel { get; set; } = AdminAccessLevels.Normal;
}
