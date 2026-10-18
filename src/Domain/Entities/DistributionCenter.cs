namespace Smart_Routes.Domain.Entities;

/// <summary>
/// CENTRO_DISTRIBUCION. Almacén donde radican los pedidos y desde el que parten las rutas.
/// </summary>
public class DistributionCenter : BaseAuditableEntity
{
    /// <summary>nombre_centro.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>programa_logistico.</summary>
    public string LogisticsProgram { get; set; } = string.Empty;

    /// <summary>CUBRE: zonas cubiertas por el centro.</summary>
    public IList<CenterZone> CoveredZones { get; private set; } = new List<CenterZone>();

    /// <summary>AUTORIZADO_EN: coordinadores autorizados en el centro.</summary>
    public IList<CoordinatorCenter> AuthorizedCoordinators { get; private set; } = new List<CoordinatorCenter>();

    /// <summary>ASIGNADO_A: repartidores asignados al centro.</summary>
    public IList<DeliveryPersonCenter> AssignedDeliveryPersons { get; private set; } = new List<DeliveryPersonCenter>();

    /// <summary>RADICADO_EN: pedidos custodiados en el centro.</summary>
    public IList<Order> Orders { get; private set; } = new List<Order>();

    /// <summary>ORIGINADA_EN: rutas que parten del centro.</summary>
    public IList<Route> Routes { get; private set; } = new List<Route>();
}
