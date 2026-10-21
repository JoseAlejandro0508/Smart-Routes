namespace Smart_Routes.Domain.Enums;

/// <summary>
/// Manual result of REPROGRAMACION: the coordinator reassigns, reschedules
/// or returns the package to the warehouse.
/// </summary>
public enum ManualResolution
{
    Reassigned = 0,
    Rescheduled = 1,
    ReturnedToWarehouse = 2
}
