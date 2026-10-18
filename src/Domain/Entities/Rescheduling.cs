namespace Smart_Routes.Domain.Entities;

/// <summary>
/// REPROGRAMACION. Expediente abierto cuando una entrega falla.
/// </summary>
public class Rescheduling : BaseAuditableEntity
{
    /// <summary>fecha_solicitud.</summary>
    public DateTimeOffset RequestDate { get; set; }

    /// <summary>motivo.</summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>estado_solicitud.</summary>
    public ReschedulingStatus Status { get; set; } = ReschedulingStatus.Pending;

    /// <summary>resultado_manual (se completa al resolver).</summary>
    public ManualResolution? ManualResult { get; set; }

    /// <summary>fecha_resolucion (posterior a fecha_solicitud).</summary>
    public DateTimeOffset? ResolutionDate { get; set; }

    /// <summary>REQUIERE: entrega fallida que la origina (única).</summary>
    public int DeliveryRecordId { get; set; }

    public DeliveryRecord DeliveryRecord { get; set; } = null!;

    /// <summary>SOLICITA: repartidor que emite la solicitud.</summary>
    public string DeliveryPersonId { get; set; } = string.Empty;

    public DeliveryPerson DeliveryPerson { get; set; } = null!;

    /// <summary>RESUELVE: coordinador elegido para el dictamen manual.</summary>
    public string CoordinatorId { get; set; } = string.Empty;

    public LogisticsCoordinator Coordinator { get; set; } = null!;
}
