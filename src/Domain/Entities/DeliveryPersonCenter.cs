namespace Smart_Routes.Domain.Entities;

/// <summary>
/// REPARTIDOR_CENTRO (interrelación N:M ASIGNADO_A). PK compuesta (id_repartidor, id_centro).
/// </summary>
public class DeliveryPersonCenter
{
    public string DeliveryPersonId { get; set; } = string.Empty;

    public DeliveryPerson DeliveryPerson { get; set; } = null!;

    public int DistributionCenterId { get; set; }

    public DistributionCenter DistributionCenter { get; set; } = null!;
}
