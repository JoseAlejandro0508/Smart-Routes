namespace Smart_Routes.Domain.Entities;

/// <summary>
/// PARADA. Physical location where the vehicle stops to deliver one or more orders.
/// </summary>
public class NewStop 
{
    /// <summary>Address (direccion).</summary>
    public required string Address { get; set; } 
    public required double X { get; set; }
    public required double Y { get; set; }

    /// <summary>LOCALIZADA_EN: zone where the stop is located.</summary>
    public int ZoneId { get; set; }


}
