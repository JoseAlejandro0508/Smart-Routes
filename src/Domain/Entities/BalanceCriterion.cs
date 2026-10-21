namespace Smart_Routes.Domain.Entities;

/// <summary>
/// CRITERIO_EQUILIBRIO. Balancing rule used by the route generator, made up of parameters.
/// </summary>
public class BalanceCriterion : BaseAuditableEntity
{
    /// <summary>Criterion name (nombre_criterio).</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Criterion description (descripcion_criterio).</summary>
    public string? Description { get; set; }

    /// <summary>DEFINE: coordinator who authored the criterion (id_coord_autor); null for predefined criteria.</summary>
    public string? AuthorCoordinatorId { get; set; }

    public LogisticsCoordinator? AuthorCoordinator { get; set; }

    /// <summary>A criterion is predefined when it has no author. Derived, so it is not stored.</summary>
    public bool IsPredefined => AuthorCoordinatorId is null;

    /// <summary>PERTENECE_A: parameters that make up the criterion.</summary>
    public IList<BalanceParameter> Parameters { get; private set; } = new List<BalanceParameter>();
}
