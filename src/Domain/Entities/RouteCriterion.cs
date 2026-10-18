namespace Smart_Routes.Domain.Entities;

/// <summary>
/// RUTA_CRITERIO (interrelación N:M APLICA_CRITERIO). PK compuesta (id_ruta, id_criterio).
/// </summary>
public class RouteCriterion
{
    public int RouteId { get; set; }

    public Route Route { get; set; } = null!;

    public int BalanceCriterionId { get; set; }

    public BalanceCriterion BalanceCriterion { get; set; } = null!;

    /// <summary>parametros_configuracion: parametrización congelada al generar la ruta (RF-09).</summary>
    public string ConfigurationParameters { get; set; } = string.Empty;
}
