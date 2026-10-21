namespace Smart_Routes.Domain.Entities;

/// <summary>
/// PARAMETRO. Atomic condition of a criterion: a metric computed on the route, a comparison
/// operator and, when the metric requires it, a target delivery type.
/// </summary>
public class BalanceParameter : BaseAuditableEntity
{
    /// <summary>Parameter name (nombre_parametro).</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Metric (metrica).</summary>
    public BalanceMetric Metric { get; set; }

    /// <summary>Comparison operator (operador).</summary>
    public ComparisonOperator Operator { get; set; }

    /// <summary>Target delivery type (tipo_entrega_objetivo); required only when the metric is a delivery type proportion.</summary>
    public DeliveryType? TargetDeliveryType { get; set; }

    /// <summary>PERTENECE_A: criterion the parameter belongs to.</summary>
    public int BalanceCriterionId { get; set; }

    public BalanceCriterion BalanceCriterion { get; set; } = null!;

    /// <summary>APLICA_PARAMETRO: values applied to routes.</summary>
    public IList<RouteParameter> RouteParameters { get; private set; } = new List<RouteParameter>();

    /// <summary>INDICA_PARAMETRO: values indicated by supervisors in reviews.</summary>
    public IList<ReviewParameter> ReviewParameters { get; private set; } = new List<ReviewParameter>();
}
