namespace Smart_Routes.Domain.Enums;

/// <summary>
/// resultado_manual de REPROGRAMACION: el coordinador reasigna, reprograma
/// o devuelve el paquete al almacén.
/// </summary>
public enum ManualResolution
{
    Reassigned = 0,
    Rescheduled = 1,
    ReturnedToWarehouse = 2
}
