namespace Smart_Routes.Domain.Entities;

/// <summary>
/// RUTA_PEDIDO (N:M relationship CONTIENE_PEDIDO). Composite PK (id_ruta, id_pedido).
/// </summary>
/// <remarks>
/// Implements the ITEM_RUTA aggregation ("an order within a specific route"): delivery records
/// and rescheduling requests hang from it, so each route keeps its own history for the order.
/// </remarks>
public class RouteOrderStatus
{
    public required NewStop StopInfo { get; set; }
    public  required OrderStatus Status{ get; set; }= OrderStatus.Pending;

    public required IList<int> OrdersIds { get; set; }


    

}
