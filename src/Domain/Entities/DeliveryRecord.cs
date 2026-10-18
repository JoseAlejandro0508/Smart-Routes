namespace Smart_Routes.Domain.Entities;

/// <summary>
/// REGISTRO_ENTREGA. Constancia levantada en campo al intentar entregar un pedido.
/// </summary>
public class DeliveryRecord : BaseAuditableEntity
{
    /// <summary>fecha_hora.</summary>
    public DateTimeOffset AttemptedAt { get; set; }

    /// <summary>resultado.</summary>
    public DeliveryResult Result { get; set; }

    /// <summary>observaciones.</summary>
    public string? Observations { get; set; }

    /// <summary>ORIGINA: pedido entregado (único: un pedido tiene como máximo un registro).</summary>
    public int OrderId { get; set; }

    public Order Order { get; set; } = null!;

    /// <summary>REQUIERE: reprogramación abierta si la entrega falló (0..1).</summary>
    public Rescheduling? Rescheduling { get; set; }
}
