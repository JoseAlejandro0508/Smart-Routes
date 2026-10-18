namespace Smart_Routes.Domain.Entities;

/// <summary>
/// ZONA. Sector territorial atendido por uno o más centros. Sus conexiones viales se
/// gestionan fuera del modelo relacional (motor de grafos, RNF-03).
/// </summary>
public class Zone : BaseAuditableEntity
{
    /// <summary>nombre_zona.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>CUBRE: centros que cubren la zona.</summary>
    public IList<CenterZone> CoveringCenters { get; private set; } = new List<CenterZone>();

    /// <summary>LOCALIZADA_EN: paradas ubicadas en la zona.</summary>
    public IList<Stop> Stops { get; private set; } = new List<Stop>();
}
