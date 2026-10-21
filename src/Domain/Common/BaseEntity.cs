using System.ComponentModel.DataAnnotations.Schema;

namespace Smart_Routes.Domain.Common;

/// <summary>
/// Non-generic contract so the infrastructure can dispatch domain events
/// regardless of the entity's primary key type.
/// </summary>
public interface IHasDomainEvents
{
    IReadOnlyCollection<BaseEvent> DomainEvents { get; }

    void ClearDomainEvents();
}

/// <summary>
/// Base entity with a primary key of type <typeparamref name="TKey"/> and domain event support.
/// </summary>
public abstract class BaseEntity<TKey> : IHasDomainEvents
{
    public TKey Id { get; set; } = default!;

    private readonly List<BaseEvent> _domainEvents = new();

    [NotMapped]
    public IReadOnlyCollection<BaseEvent> DomainEvents => _domainEvents.AsReadOnly();

    public void AddDomainEvent(BaseEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    public void RemoveDomainEvent(BaseEvent domainEvent)
    {
        _domainEvents.Remove(domainEvent);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}

/// <summary>
/// Base entity with an integer primary key (the template's default case).
/// </summary>
public abstract class BaseEntity : BaseEntity<int>
{
}
