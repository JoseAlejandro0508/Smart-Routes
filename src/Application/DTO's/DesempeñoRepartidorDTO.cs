using System.Collections.Generic;
using Smart-Routes.Domain.Entities;

namespace Smart-Routes.Application.DTOs

/// <summary>F4: Desempeño de repartidores en una ruta.</summary>

public class DesempenoRepartidorDto
    {

    
    public string RepartidorId { get; set; }
    
    public string RutaId { get; set; }
    
    public NivelPrioridad Prioridad { get; set; }
    
    public int TotalPedidos { get; set; }
    
    public int EntregadosATiempo { get; set; }
    
    public double TasaEntregaATiempo => TotalPedidos == 0 ? 0 : (double)EntregadosATiempo / TotalPedidos;
    
    }