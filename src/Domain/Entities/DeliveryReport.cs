using Smart-Routes.Domain.Enums;

namespace Smart_Routes.Domain.Entities;

/// <summary>
/// Registro de una entrega ejecutada dentro de una ruta. Garantiza el
/// almacenamiento de cada entrega registrada.
/// </summary>

public class ReporteEntrega
{

    public string Id { get; set; }

    public string RutaId { get; set; }

    public string ParadaId { get; set; }

    public string PedidoId { get; set; }

    public string RepartidorId { get; set; }

    public string CentroDistribucionId { get; set; }

    public NivelPrioridad PrioridadPedido { get; set; }

    public DateTime FechaHoraEntrega { get; set; }

    public bool EntregadoATiempo { get; set; }

    public string? Observaciones { get; set; }

}