namespace Smart_Routes.Domain.Common;

/// <summary>
/// Non-generic auditing contract, used by the EF interceptor to fill in the audit fields.
/// </summary>
public interface IAuditableEntity
{
    DateTimeOffset Created { get; set; }

    string? CreatedBy { get; set; }

    DateTimeOffset LastModified { get; set; }

    string? LastModifiedBy { get; set; }
}

/// <summary>
/// Auditable entity with a primary key of type <typeparamref name="TKey"/>.
/// </summary>
public abstract class BaseAuditableEntity<TKey> : BaseEntity<TKey>, IAuditableEntity
{
    public DateTimeOffset Created { get; set; }

    public string? CreatedBy { get; set; }

    public DateTimeOffset LastModified { get; set; }

    public string? LastModifiedBy { get; set; }
}

/// <summary>
/// Auditable entity with an integer primary key.
/// </summary>
public abstract class BaseAuditableEntity : BaseAuditableEntity<int>
{
}
