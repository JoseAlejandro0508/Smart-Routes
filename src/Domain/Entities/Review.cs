namespace Smart_Routes.Domain.Entities;

/// <summary>
/// REVISION. A supervisor's review of a route, with its decision and observations.
/// A route can have several reviews; the latest one determines its status.
/// </summary>
public class Review : BaseAuditableEntity
{
    /// <summary>Review date and time (fecha_hora_revision), later than the route's creation date.</summary>
    public DateTimeOffset ReviewedAt { get; set; }

    /// <summary>Decision (decision).</summary>
    public ReviewDecision Decision { get; set; }

    /// <summary>Observations (observaciones_revision); required when the decision is rejected.</summary>
    public string? Observations { get; set; }

    /// <summary>REVISA: supervisor who made the review.</summary>
    public string SupervisorId { get; set; } = string.Empty;

    public OperationsSupervisor Supervisor { get; set; } = null!;

    /// <summary>EVALUA: reviewed route.</summary>
    public int RouteId { get; set; }

    public Route Route { get; set; } = null!;

    /// <summary>INDICA_PARAMETRO: parameter values indicated on rejection; their presence is the re-confection request.</summary>
    public IList<ReviewParameter> IndicatedParameters { get; private set; } = new List<ReviewParameter>();

    /// <summary>RECONFECCIONA: new route built from this review (0..1).</summary>
    public Route? ReconfiguredRoute { get; set; }
}
