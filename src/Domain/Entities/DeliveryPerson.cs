namespace Smart_Routes.Domain.Entities;

/// <summary>
/// REPARTIDOR (subtype of USUARIO). Drives the vehicle and makes the deliveries on the assigned route.
/// </summary>
/// <remarks>
/// Availability is transient operational state kept in the key-value store (4.5), not here.
/// The delivery person who requests a rescheduling is derived from the route (EJECUTA), not stored.
/// </remarks>
public class DeliveryPerson : BaseUserProfile
{
    /// <summary>Date of birth. The report stores edad (age at least 18); age is derived from this date.</summary>
    public DateOnly DateOfBirth { get; set; }

    /// <summary>Fleet the delivery person belongs to (flota).</summary>
    public string Fleet { get; set; } = string.Empty;

    /// <summary>ASIGNADO_A: centers where the delivery person can receive routes.</summary>
    public IList<DeliveryPersonCenter> AssignedCenters { get; private set; } = new List<DeliveryPersonCenter>();

    /// <summary>EJECUTA: routes the delivery person drives.</summary>
    public IList<Route> Routes { get; private set; } = new List<Route>();
}
