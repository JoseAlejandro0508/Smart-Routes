namespace Smart_Routes.Domain.Enums;

/// <summary>
/// Metric of PARAMETRO (metrica): a closed catalog of values that can be computed from a route's data (RI-05).
/// The unit of each metric is fixed by the application and is not stored.
/// </summary>
public enum BalanceMetric
{
    /// <summary>CANTIDAD_PEDIDOS: number of orders in the route.</summary>
    OrderCount = 0,

    /// <summary>PROPORCION_TIPO: share of orders of the target delivery type, in [0, 1].</summary>
    DeliveryTypeProportion = 1,

    /// <summary>CANTIDAD_ZONAS: number of distinct zones visited.</summary>
    ZoneCount = 2,

    /// <summary>PESO_TOTAL: total weight of the orders, in kg.</summary>
    TotalWeight = 3,

    /// <summary>CANTIDAD_PARADAS: number of stops in the route.</summary>
    StopCount = 4
}
