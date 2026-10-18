namespace Smart_Routes.Domain.Enums;

/// <summary>
/// tipo_rol de USUARIO: determina en qué tabla subtipo tiene su fila el usuario.
/// </summary>
public enum UserRole
{
    Administrator = 0,
    LogisticsCoordinator = 1,
    OperationsSupervisor = 2,
    DeliveryPerson = 3
}
