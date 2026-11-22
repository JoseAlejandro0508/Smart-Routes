using Smart-Routes.Domain.Enums;
namespace Smart_Routes.Domain.Entities;

/// <summary>
/// Solicitud virtual de reprogramación de entrega realizada por un
/// repartidor, especificando el coordinador que la ejecutará.
/// </summary>

public class SolicitudReprogramacion
{

    public string Id { get; set; }

    public string RepartidorSolicitanteId { get; set; }

    public string CoordinadorEjecutorId { get; set; }

    public string PedidoId { get; set; }

    public string RutaOriginalId { get; set; }

    public string? RutaNuevaId { get; set; }

    public EstadoReprogramacion Estado { get; set; }

    public string Motivo { get; set; }

    public DateTime FechaSolicitud { get; set; }

    public DateTime? FechaResultado { get; set; }

    public string? ResultadoManual { get; set; }
}