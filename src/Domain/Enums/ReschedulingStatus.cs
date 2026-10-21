namespace Smart_Routes.Domain.Enums;

/// <summary>
/// Request status of REPROGRAMACION (estado_solicitud). The report only requires a closed set of values;
/// these values must be validated with the team.
/// </summary>
public enum ReschedulingStatus
{
    Pending = 0,
    InProgress = 1,
    Resolved = 2
}
