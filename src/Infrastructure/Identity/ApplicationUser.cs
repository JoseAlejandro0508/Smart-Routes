using Microsoft.AspNetCore.Identity;
using Smart_Routes.Domain.Enums;

namespace Smart_Routes.Infrastructure.Identity;

/// <summary>
/// USUARIO (superentity of the ISA hierarchy). Identity provides id_usuario (Id), email
/// and password_hash (PasswordHash); the report's remaining attributes are added here.
/// </summary>
public class ApplicationUser : IdentityUser
{
    /// <summary>Full name (nombre).</summary>
    public string? Name { get; set; }

    /// <summary>tipo_rol: indicates which subtype table holds the user's row (total, disjoint specialization).</summary>
    public UserRole RoleType { get; set; }

    /// <summary>activo: users are never deleted, only deactivated (RF-01).</summary>
    public bool Active { get; set; } = true;


}
