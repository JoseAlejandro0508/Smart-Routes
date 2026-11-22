using Smart-Routes.Domain.Enums;
namespace Smart_Routes.Domain.Entities;

/// <summary>
/// Repartidor. Ejecuta rutas asignadas en los centros donde está
/// asignado. Pertenece a una flota.
/// </summary>

public class Repartidor
{

    public string Id { get; set; }

    public string Nombre { get; set; }

    public int Edad { get; set; }

    public string FlotaId { get; set; }                 // Referencia a flota

    public List<string> CentrosAsignadosIds { get; set; } = new();

    public bool Disponible { get; set; }                // Consulta constante

    public DateTime UltimaActualizacion { get; set; }
}