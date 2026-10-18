namespace Smart_Routes.Domain.Entities;

/// <summary>
/// CENTRO_ZONA (interrelación N:M CUBRE). PK compuesta (id_centro, id_zona).
/// </summary>
public class CenterZone
{
    public int DistributionCenterId { get; set; }

    public DistributionCenter DistributionCenter { get; set; } = null!;

    public int ZoneId { get; set; }

    public Zone Zone { get; set; } = null!;
}
