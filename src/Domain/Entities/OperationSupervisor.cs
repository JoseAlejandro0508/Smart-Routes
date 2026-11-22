using Smart-Routes.Domain.Enums;
namespace Smart_Routes.Domain.Entities;

/// <summary>Supervisor de operaciones: revisa y aprueba rutas generadas.</summary>

public class SupervisorOperaciones
{

    public string Id { get; set; }

    public string Nombre { get; set; }

    public List<string> CentrosAutorizadosIds { get; set; } = new();

}