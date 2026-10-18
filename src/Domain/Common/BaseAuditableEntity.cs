namespace Smart_Routes.Domain.Common;

/// <summary>
/// Contrato no genérico de auditoría, usado por el interceptor de EF para completar los campos.
/// </summary>
public interface IAuditableEntity
{
    DateTimeOffset Created { get; set; }

    string? CreatedBy { get; set; }

    DateTimeOffset LastModified { get; set; }

    string? LastModifiedBy { get; set; }
}

/// <summary>
/// Entidad auditable con clave primaria de tipo <typeparamref name="TKey"/>.
/// </summary>
public abstract class BaseAuditableEntity<TKey> : BaseEntity<TKey>, IAuditableEntity
{
    public DateTimeOffset Created { get; set; }

    public string? CreatedBy { get; set; }

    public DateTimeOffset LastModified { get; set; }

    public string? LastModifiedBy { get; set; }
}

/// <summary>
/// Entidad auditable con clave primaria entera.
/// </summary>
public abstract class BaseAuditableEntity : BaseAuditableEntity<int>
{
}
