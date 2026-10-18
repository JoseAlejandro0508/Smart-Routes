namespace Smart_Routes.Domain.Enums;

/// <summary>
/// estado_ruta de RUTA: Pendiente de Aprobación, Aprobada o Rechazada / En Modificación (RF-13).
/// </summary>
public enum RouteStatus
{
    PendingApproval = 0,
    Approved = 1,
    RejectedInModification = 2
}
