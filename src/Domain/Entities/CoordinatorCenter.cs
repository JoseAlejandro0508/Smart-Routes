namespace Smart_Routes.Domain.Entities;

/// <summary>
/// COORDINADOR_CENTRO (N:M relationship AUTORIZADO_EN). Composite PK (id_coordinador, id_centro).
/// </summary>
public class CoordinatorCenter
{
    public string CoordinatorId { get; set; } = string.Empty;

    public LogisticsCoordinator Coordinator { get; set; } = null!;

    public int DistributionCenterId { get; set; }

    public DistributionCenter DistributionCenter { get; set; } = null!;
}
