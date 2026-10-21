namespace Smart_Routes.Domain.Enums;

/// <summary>
/// Status of PEDIDO (estado_pedido): pending, in route, delivered or returned (3.2).
/// </summary>
public enum OrderStatus
{
    Pending = 0,
    InRoute = 1,
    Delivered = 2,
    Returned = 3
}
