namespace Smart_Routes.Domain.Entities;

/// <summary>
/// REVISION. A supervisor's review of a route, with its decision and observations.
/// A route can have several reviews; the latest one determines its status.
/// </summary>
public class Review : BaseAuditableEntity
{


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

    public int? BalanceCriterioId{ get; set; }
    public BalanceCriterion? BalanceCriterion{ get; set; }

    /// <summary>RECONFECCIONA: new route built from this review (0..1).</summary>
    public Route? ReconfiguredRoute { get; set; }
}
