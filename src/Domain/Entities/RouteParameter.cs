namespace Smart_Routes.Domain.Entities;

/// <summary>
/// RUTA_PARAMETRO (N:M relationship APLICA_PARAMETRO). Composite PK (id_ruta, id_parametro).
/// </summary>
public class RouteParameter
{
    public int RouteId { get; set; }

    public Route Route { get; set; } = null!;

    public int BalanceParameterId { get; set; }

    public BalanceParameter BalanceParameter { get; set; } = null!;

    /// <summary>valor_aplicado: value frozen when the route was generated; in [0, 1] for a delivery type proportion.</summary>
    public decimal AppliedValue { get; set; }
}
