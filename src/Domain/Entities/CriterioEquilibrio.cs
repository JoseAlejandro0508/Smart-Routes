using Smart-Routes.Domain.Enums;
namespace Smart_Routes.Domain.Entities;

/// <summary>
/// Definición de un criterio de equilibrio reutilizable. Permite definir
/// nuevos criterios y aplicarlos en la generación de rutas.
/// </summary>

public class CriterioEquilibrio
{

    public string Id { get; set; }

    public string Nombre { get; set; }

    public TipoCriterioEquilibrio Tipo { get; set; }

    public string Descripcion { get; set; }

    public string ExpresionParametrizacion { get; set; } // JSON/expresión configurable

    public bool Activo { get; set; }

    public DateTime FechaCreacion { get; set; }
}