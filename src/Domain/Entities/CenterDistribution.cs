using Smart-Routes.Domain.Enums;
namespace Smart_Routes.Domain.Entities;

/// <summary>
/// Centro de distribución. Entidad raíz con identificador único.
/// Contiene la lista de zonas que cubre a lo largo de la operación.
/// </summary>

public class CentroDistribucion
{

    public string Id { get; set; }                     // Identificador único

    public string Nombre { get; set; }

    public string ProgramaLogistico { get; set; }

    public List<Zona> Zonas { get; set; } = new();     // Zonas embebidas (ver recomendación)

    public DateTime FechaCreacion { get; set; }
}