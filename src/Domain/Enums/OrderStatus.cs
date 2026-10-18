namespace Smart_Routes.Domain.Enums;

/// <summary>
/// estado_pedido de PEDIDO. El informe solo exige un catálogo cerrado; estos valores
/// siguen el ciclo de vida descrito en los requisitos y deben validarse con el equipo.
/// </summary>
public enum OrderStatus
{
    Registered = 0,
    AssignedToRoute = 1,
    Delivered = 2,
    DeliveryFailed = 3,
    ReturnedToWarehouse = 4
}
