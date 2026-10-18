namespace Smart_Routes.Domain.Entities;

/// <summary>
/// CRITERIO_EQUILIBRIO. Regla de balanceo usada por el generador de rutas.
/// </summary>
public class BalanceCriterion : BaseAuditableEntity
{
    /// <summary>nombre_criterio.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>descripcion_criterio.</summary>
    public string? Description { get; set; }

    /// <summary>es_preestablecido: true si es del sistema, false si lo definió un coordinador.</summary>
    public bool IsPredefined { get; set; }

    /// <summary>APLICA_CRITERIO: rutas que aplicaron este criterio.</summary>
    public IList<RouteCriterion> RouteCriteria { get; private set; } = new List<RouteCriterion>();
}
