using Smart-Routes.Domain.Enums;
namespace Smart_Routes.Domain.Entities;

/// <summary>
/// Parada dentro de una ruta. Contiene el pedido asociado y su estado
/// de ejecución. Se modela embebida dentro de la ruta.
/// </summary>
/// 

public class Parada

{

    public string Id { get; set; }

    public string PedidoId { get; set; }                // Referencia al pedido

    public int Orden { get; set; }                      // Orden dentro de la ruta

    public EstadoParada Estado { get; set; }

    public DateTime? FechaHoraEstimada { get; set; }

    public DateTime? FechaHoraReal { get; set; }

    public string? Observaciones { get; set; }

}