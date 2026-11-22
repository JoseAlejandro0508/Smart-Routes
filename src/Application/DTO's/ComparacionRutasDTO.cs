using System.Collections.Generic;
using Smart-Routes.Domain.Entities;

namespace Smart-Routes.Application.DTOs

/// <summary>F5: Comparación de rutas entre centros.</summary>

public class ComparacionRutasDto
{

    public string CentroId { get; set; }

    public string RutaId { get; set; }

    public Dictionary<string, int> PedidosPorZona { get; set; } = new();

    public Dictionary<NivelPrioridad, int> PedidosPorPrioridad { get; set; } = new();

    public bool CriteriosCumplidos { get; set; }

}