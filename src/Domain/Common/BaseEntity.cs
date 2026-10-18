using System.ComponentModel.DataAnnotations.Schema;

namespace Smart_Routes.Domain.Common;

/// <summary>
/// Contrato no genérico para que la infraestructura pueda despachar los eventos de dominio
/// sin importar el tipo de la clave primaria de la entidad.
/// </summary>
public interface IHasDomainEvents
{
    IReadOnlyCollection<BaseEvent> DomainEvents { get; }

    void ClearDomainEvents();
}

/// <summary>
/// Entidad base con clave primaria de tipo <typeparamref name="TKey"/> y soporte de eventos de dominio.
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
/// Entidad base con clave primaria entera (el caso por defecto de la plantilla).
/// </summary>
public abstract class BaseEntity : BaseEntity<int>
{
}
