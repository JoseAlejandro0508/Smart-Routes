using Smart-Routes.Domain.Enums;
namespace Smart_Routes.Domain.Entities;

/// <summary>
/// Zona de Smart-Routes. Puede modelarse embebida dentro del centro o como
/// documento referenciado si se comparte entre centros.
/// </summary>

public class Zona
{

public string Id { get; set; }

public string Nombre { get; set; }

public string CodigoPostal { get; set; }

public string CentroDistribucionId { get; set; }   // Referencia al centro dueño

public double Latitud { get; set; }

public double Longitud { get; set; }
}