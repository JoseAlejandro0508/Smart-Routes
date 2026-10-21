namespace Smart_Routes.Domain.Enums;

/// <summary>
/// Role type of USUARIO (tipo_rol): determines which subtype table holds the user's row.
/// </summary>
public enum UserRole
{
    Administrator = 0,
    LogisticsCoordinator = 1,
    OperationsSupervisor = 2,
    DeliveryPerson = 3
}
