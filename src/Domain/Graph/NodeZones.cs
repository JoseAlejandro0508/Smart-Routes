    using System.Collections.Generic;
    using System.Linq;
    namespace Smart-Routes.Domain.Graph

    /// <summary>
    /// Nodo del grafo de zonas. Representa un punto de tránsito o zona.
    /// NO es una tabla relacional: se gestiona como estructura de grafo.
    /// </summary>
    public class NodoZona
    {
        public string Id { get; set; }
        public string Nombre { get; set; }
        public string? ZonaId { get; set; }                 // Vínculo opcional a zona
        public double Latitud { get; set; }
        public double Longitud { get; set; }
    }