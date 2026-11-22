using Smart-Routes.Domain.Enums;
namespace Smart_Routes.Domain.Entities;

/// <summary>Flota a la que pertenece un repartidor.</summary>

public class Flota
{

    public string Id { get; set; }

    public string Nombre { get; set; }

    public string TipoVehiculo { get; set; }

    public int CapacidadMaxima { get; set; }

    public double PesoMaximoKg { get; set; }
}
