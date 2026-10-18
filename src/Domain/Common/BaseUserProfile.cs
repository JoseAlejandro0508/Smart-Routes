namespace Smart_Routes.Domain.Common;

/// <summary>
/// Base de los subtipos de la jerarquía ISA total y disjunta de USUARIO
/// (COORDINADOR_LOGISTICO, REPARTIDOR, SUPERVISOR_OPERACIONES, ADMINISTRADOR).
/// </summary>
/// <remarks>
/// La superentidad USUARIO es el usuario de ASP.NET Identity (vive en Infrastructure).
/// El <see cref="BaseEntity{TKey}.Id"/> de cada subtipo es a la vez clave primaria y clave
/// foránea hacia USUARIO, por eso es <see cref="string"/>: coincide con el Id de Identity.
/// </remarks>
public abstract class BaseUserProfile : BaseAuditableEntity<string>
{
}
