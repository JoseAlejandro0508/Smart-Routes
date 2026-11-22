using System.Collections.Generic;
using Smart-Routes.Domain.Entities;

namespace Smart-Routes.Application.DTOs

    /// <summary>F3: Ruta validada por un revisor.</summary>

    public class RutaValidadaDto
    {

        public string RutaId { get; set; }

        public string RevisorId { get; set; }

        public DateTime FechaValidacion { get; set; }

        public string Observaciones { get; set; }
    }