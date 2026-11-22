using Smart-Routes.Domain.Enums;
namespace Smart_Routes.Domain.Entities;

/// <summary>Administrador del sistema: evita duplicados y doble asignación.</summary>

public class AdministradorSistema
{

    public string Id { get; set; }

    public string Nombre { get; set; }

    public string Email { get; set; }
}