namespace Smart_Routes.Domain.Entities;

/// <summary>
/// ZONA. Territorial sector served by one or more centers. Its road connections are
/// managed outside the relational model (graph engine, RNF-03).
/// </summary>
public class Zone : BaseAuditableEntity
{
    /// <summary>Zone name (nombre_zona).</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>CUBRE: centers covering the zone.</summary>
    public IList<CenterZone> CoveringCenters { get; private set; } = new List<CenterZone>();

    /// <summary>LOCALIZADA_EN: stops located in the zone.</summary>
    public IList<Stop> Stops { get; private set; } = new List<Stop>();
}
