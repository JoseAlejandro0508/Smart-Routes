using Smart-Routes.Domain.Enums;
namespace Smart_Routes.Domain.Entities;

/// <summary>
/// Pedido ingresado por un coordinador. Clasificado por zona, tipo de
/// entrega y prioridad. Puede formar parte de una ruta.
/// </summary>

public class Pedido
{

    public string Id { get; set; }

    public string CentroDistribucionId { get; set; }

    public string ZonaId { get; set; }                  // Referencia a zona

    public string CoordinadorCreadorId { get; set; }    // Quién lo ingresó

    public TipoEntrega TipoEntrega { get; set; }

    public NivelPrioridad Prioridad { get; set; }

    public string Descripcion { get; set; }

    public string DireccionEntrega { get; set; }

    public double PesoKg { get; set; }

    public DateTime FechaCreacion { get; set; }

    public bool Duplicado { get; set; }                 // Control del admin

    public string? RutaId { get; set; }                 // Ruta a la que pertenece (null si libre)
}