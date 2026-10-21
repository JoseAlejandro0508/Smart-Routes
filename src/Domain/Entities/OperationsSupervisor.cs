namespace Smart_Routes.Domain.Entities;

/// <summary>
/// SUPERVISOR_OPERACIONES (subtype of USUARIO). Reviews generated routes, approves or rejects them
/// and can request that another route be built.
/// </summary>
public class OperationsSupervisor : BaseUserProfile
{
    /// <summary>Control area (area_control).</summary>
    public string ControlArea { get; set; } = string.Empty;

    /// <summary>REVISA: reviews made by this supervisor.</summary>
    public IList<Review> Reviews { get; private set; } = new List<Review>();
}
