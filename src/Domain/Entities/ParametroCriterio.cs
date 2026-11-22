using Smart-Routes.Domain.Enums;
namespace Smart_Routes.Domain.Entities;

/// <summary>
/// Parámetro concreto de un criterio de equilibrio aplicado a una ruta.
/// Se almacena junto a la ruta generada para trazabilidad.
/// </summary>

public class ParametroCriterio
{

    public string CriterioId { get; set; }              // Referencia al criterio

    public TipoCriterioEquilibrio Tipo { get; set; }

    public string Nombre { get; set; }

    public string Valor { get; set; }                   // Valor parametrizado

    public double Peso { get; set; }                    // Ponderación
}