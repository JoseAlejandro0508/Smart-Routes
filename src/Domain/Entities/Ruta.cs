using Smart-Routes.Domain.Enums;
namespace Smart_Routes.Domain.Entities;

///<summary>
/// Ruta de Smart-Routes generada automáticamente. Almacena los parámetros
/// (criterios de equilibrio) utilizados en su generación y las paradas
/// que la componen (embebidas).
/// </summary>

public class Ruta
{

    public string Id { get; set; }

    public string CentroDistribucionId { get; set; }

    public string CoordinadorCreadorId { get; set; }    // Quién la generó

    public string? SupervisorValidadorId { get; set; }  // Quién la aprobó

    public EstadoRuta Estado { get; set; }

    public DateTime FechaCreacion { get; set; }

    public DateTime? FechaValidacion { get; set; }

    public string? ObservacionesValidacion { get; set; }

    // Parámetros/criterios de equilibrio utilizados (embebidos junto a la ruta)

    public List<ParametroCriterio> ParametrosUtilizados { get; set; } = new();

    // Paradas que componen la ruta (embebidas)

    public List<Parada> Paradas { get; set; } = new();

    // Repartidor asignado (referencia; control de doble asignación en servicio)

    public string? RepartidorAsignadoId { get; set; }

    public DateTime? FechaAsignacion { get; set; }
}
