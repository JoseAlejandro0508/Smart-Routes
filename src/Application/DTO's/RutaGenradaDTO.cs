using System;
using System.Collections.Generic;
using Smart-Routes.Domain.Entities;

namespace Smart-Routes.Application.DTOs

/// <summary>F1: Listado de rutas generadas para un centro.</summary>

public class RutaGeneradaDto
{

    public string RutaId { get; set; }

    public string NombreCreador { get; set; }

    public DateTime FechaCreacion { get; set; }

    public List<ParametroCriterio> Parametros { get; set; } = new();

}
