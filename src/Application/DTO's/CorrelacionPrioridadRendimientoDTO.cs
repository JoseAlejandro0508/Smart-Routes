using System;
using System.Collections.Generic;
using Smart-Routes.Domain.Entities;

namespace Smart-Routes.Application.DTOs
    
    /// <summary>F6: Correlación prioridad / rendimiento y top 10 incumplimiento.</summary>
     
    public class CorrelacionPrioridadRendimientoDto
    {
        
        public string CentroId { get; set; }
        
        public double CoeficienteCorrelacion { get; set; }
        
        public List<PedidoIncumplimientoDto> Top10Incumplimiento { get; set; } = new();
        
        public List<ComparacionReprogramacionDto> ComparacionReprogramaciones { get; set; } = new();
    }

    public class PedidoIncumplimientoDto
    {
        
        public string PedidoId { get; set; }
        
        public double TasaIncumplimiento { get; set; }
        
        public string CoordinadorCreadorId { get; set; }
        
        public string CentroDistribucionId { get; set; }
    }

    public class ComparacionReprogramacionDto
    {
        
        public string RepartidorId { get; set; }
        
        public double TasaEntregaATiempoRepartidor { get; set; }
        
        public double PromedioFlota { get; set; }
    }