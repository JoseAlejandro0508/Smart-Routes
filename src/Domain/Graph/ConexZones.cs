    using System.Collections.Generic;
    using System.Linq;
    namespace Smart-Routes.Domain.Graph

    /// <summary>
    /// Arista dirigida del grafo. Representa una vía entre dos nodos con
    /// distancia y tiempo estimado.
    /// </summary>
    public class ConexionZona
    {
        public string Id { get; set; }
        public string NodoOrigenId { get; set; }
        public string NodoDestinoId { get; set; }
        public double DistanciaKm { get; set; }
        public double TiempoEstimadoMin { get; set; }
        public bool Bidireccional { get; set; }             // Si aplica en ambos sentidos
    }