namespace Smart_Routes.Domain.Common;

/// <summary>
/// Base class for the subtypes of the total, disjoint ISA hierarchy of USUARIO
/// (COORDINADOR_LOGISTICO, REPARTIDOR, SUPERVISOR_OPERACIONES, ADMINISTRADOR).
/// </summary>
/// <remarks>
/// The USUARIO superentity is the ASP.NET Identity user (it lives in Infrastructure).
/// Each subtype's <see cref="BaseEntity{TKey}.Id"/> is both the primary key and a foreign
/// key to USUARIO, which is why it is a <see cref="string"/>: it matches the Identity user Id.
/// </remarks>
public abstract class BaseUserProfile : BaseAuditableEntity<string>
{
}
