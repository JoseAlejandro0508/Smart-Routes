using Microsoft.AspNetCore.Identity;
using Smart_Routes.Domain.Enums;

namespace Smart_Routes.Infrastructure.Identity;

/// <summary>
/// USUARIO (superentidad de la jerarquía ISA). Identity aporta id_usuario (Id), email
/// y password_hash (PasswordHash); el resto de los atributos del informe se agregan acá.
/// </summary>
public class ApplicationUser : IdentityUser
{
    /// <summary>nombre.</summary>
    public string? Name { get; set; }

    /// <summary>tipo_rol: indica en qué tabla subtipo tiene su fila (especialización total y disjunta).</summary>
    public UserRole RoleType { get; set; }

    /// <summary>activo: los usuarios no se eliminan, se desactivan (RF-01).</summary>
    public bool Active { get; set; } = true;


}
