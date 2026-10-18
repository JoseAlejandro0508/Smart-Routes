namespace Smart_Routes.Domain.Entities;

/// <summary>
/// REPARTIDOR (subtipo de USUARIO). Conduce el vehículo y ejecuta las entregas de la ruta asignada.
/// </summary>
public class DeliveryPerson : BaseUserProfile
{
    /// <summary>edad (entero positivo).</summary>
    public int Age { get; set; }

    /// <summary>flota a la que pertenece.</summary>
    public string Fleet { get; set; } = string.Empty;

    /// <summary>estado_disponibilidad.</summary>
    public DeliveryPersonState AvailabilityState { get; set; } = DeliveryPersonState.Available;

    /// <summary>ASIGNADO_A: centros en los que está habilitado para recibir asignaciones.</summary>
    public IList<DeliveryPersonCenter> AssignedCenters { get; private set; } = new List<DeliveryPersonCenter>();

    /// <summary>EJECUTA: rutas que conduce.</summary>
    public IList<Route> Routes { get; private set; } = new List<Route>();

    /// <summary>SOLICITA: reprogramaciones solicitadas desde el terreno.</summary>
    public IList<Rescheduling> RequestedReschedulings { get; private set; } = new List<Rescheduling>();
}
