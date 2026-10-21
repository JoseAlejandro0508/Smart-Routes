namespace Smart_Routes.Domain.Entities;

/// <summary>
/// CENTRO_DISTRIBUCION. Warehouse where orders are held and from which routes depart.
/// </summary>
public class DistributionCenter : BaseAuditableEntity
{
    /// <summary>Center name (nombre_centro).</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Logistics program (programa_logistico).</summary>
    public string LogisticsProgram { get; set; } = string.Empty;

    /// <summary>CUBRE: zones covered by the center.</summary>
    public IList<CenterZone> CoveredZones { get; private set; } = new List<CenterZone>();

    /// <summary>AUTORIZADO_EN: coordinators authorized at the center.</summary>
    public IList<CoordinatorCenter> AuthorizedCoordinators { get; private set; } = new List<CoordinatorCenter>();

    /// <summary>ASIGNADO_A: delivery people assigned to the center.</summary>
    public IList<DeliveryPersonCenter> AssignedDeliveryPersons { get; private set; } = new List<DeliveryPersonCenter>();

    /// <summary>RADICADO_EN: orders held at the center.</summary>
    public IList<Order> Orders { get; private set; } = new List<Order>();

    /// <summary>ORIGINADA_EN: routes that depart from the center.</summary>
    public IList<Route> Routes { get; private set; } = new List<Route>();
}
