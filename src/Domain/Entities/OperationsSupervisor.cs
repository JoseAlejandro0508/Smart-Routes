namespace Smart_Routes.Domain.Entities;

/// <summary>
/// SUPERVISOR_OPERACIONES (subtipo de USUARIO). Revisa las rutas generadas y las aprueba o rechaza.
/// </summary>
public class OperationsSupervisor : BaseUserProfile
{
    /// <summary>area_control.</summary>
    public string ControlArea { get; set; } = string.Empty;

    /// <summary>REVISA_Y_APRUEBA: rutas revisadas por este supervisor.</summary>
    public IList<Route> ReviewedRoutes { get; private set; } = new List<Route>();
}
