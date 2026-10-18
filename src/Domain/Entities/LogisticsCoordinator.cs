namespace Smart_Routes.Domain.Entities;

/// <summary>
/// COORDINADOR_LOGISTICO (subtipo de USUARIO). Ingresa pedidos, configura criterios,
/// genera rutas y resuelve reprogramaciones.
/// </summary>
public class LogisticsCoordinator : BaseUserProfile
{
    /// <summary>especialidad.</summary>
    public string Specialty { get; set; } = string.Empty;

    /// <summary>AUTORIZADO_EN: centros en los que puede dar de alta pedidos y confeccionar rutas.</summary>
    public IList<CoordinatorCenter> AuthorizedCenters { get; private set; } = new List<CoordinatorCenter>();

    /// <summary>INGRESA: pedidos dados de alta por este coordinador.</summary>
    public IList<Order> Orders { get; private set; } = new List<Order>();

    /// <summary>GENERA: rutas generadas por este coordinador.</summary>
    public IList<Route> GeneratedRoutes { get; private set; } = new List<Route>();

    /// <summary>RESUELVE: reprogramaciones encomendadas a este coordinador.</summary>
    public IList<Rescheduling> AssignedReschedulings { get; private set; } = new List<Rescheduling>();
}
