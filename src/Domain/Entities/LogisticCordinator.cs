using Smart-Routes.Domain.Enums;
namespace Smart_Routes.Domain.Entities;

/// <summary>
/// Coordinador logístico. Puede crear/validar rutas en los centros
/// para los que está autorizado.
/// </summary>

public class CoordinadorLogistico
{

    public string Id { get; set; }

    public string Nombre { get; set; }

    public string Especialidad { get; set; }

    // Centros para los que está autorizado (referencias)

    public List<string> CentrosAutorizadosIds { get; set; } = new();

    public DateTime FechaIngreso { get; set; }
}