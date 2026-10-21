namespace Smart_Routes.Domain.Entities;

/// <summary>
/// ADMINISTRADOR (subtype of USUARIO). Responsible for the platform's overall integrity
/// and configuration.
/// </summary>
public class Administrator : BaseUserProfile
{
    /// <summary>Access level (nivel_acceso).</summary>
    public AdminAccessLevels AccessLevel { get; set; } = AdminAccessLevels.Normal;
}
