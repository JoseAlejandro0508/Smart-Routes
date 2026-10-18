namespace Smart_Routes.Domain.Enums;

/// <summary>
/// estado_solicitud de REPROGRAMACION. El informe solo exige un catálogo cerrado;
/// valores a validar con el equipo.
/// </summary>
public enum ReschedulingStatus
{
    Pending = 0,
    InProgress = 1,
    Resolved = 2
}
