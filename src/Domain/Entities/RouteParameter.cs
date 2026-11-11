namespace Smart_Routes.Domain.Entities;

/// <summary>
/// RUTA_PARAMETRO (N:M relationship APLICA_PARAMETRO). Composite PK (id_ruta, id_parametro).
/// </summary>
public class RouteParameter
{
    public int RouteId { get; set; }

    public Route Route { get; set; } = null!;

    public int BalanceCriterionId { get; set; }

    public BalanceCriterion BalanceCriterion { get; set; } = null!;


}
