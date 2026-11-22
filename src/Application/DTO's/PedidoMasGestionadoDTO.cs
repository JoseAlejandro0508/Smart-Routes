using System;
using System.Collections.Generic;
using Smart-Routes.Domain.Entities;

namespace Smart-Routes.Application.DTOs

/// <summary>F2: Pedido más gestionado clasificado por prioridad y zona.</summary>

public class PedidoMasGestionadoDto
{
    
    public string PedidoId { get; set; }
    
    public string ZonaId { get; set; }
    
    public NivelPrioridad Prioridad { get; set; }
    
    public int VecesGestionado { get; set; }

}