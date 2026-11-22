    using System.Collections.Generic;
    using System.Linq;
    namespace Smart-Routes.Domain.Graph
 
    /// <summary>
    /// Grafo completo de zonas y conexiones. Se gestiona de forma
    /// independiente (documento propio o motor de grafos) para navegación
    /// eficiente y consultas de rutas alternativas.
    /// </summary>
    public class GrafoZonas
    {
        
        public string Id { get; set; }
        
        public string Nombre { get; set; }
        
        public List<NodoZona> Nodos { get; set; } = new();
        
        public List<ConexionZona> Conexiones { get; set; } = new();

        // Índice de adyacencia en memoria para navegación eficiente
        private Dictionary<string, List<ConexionZona>>? _adyacencia;

        /// <summary>Construye el índice de adyacencia para recorridos dinámicos.</summary>
        public void ConstruirIndice()
        {
           
            _adyacencia = new Dictionary<string, List<ConexionZona>>();
          
            foreach (var c in Conexiones)
            {
                if (!_adyacencia.ContainsKey(c.NodoOrigenId))
               
                    _adyacencia[c.NodoOrigenId] = new List<ConexionZona>();
               
                _adyacencia[c.NodoOrigenId].Add(c);

                if (c.Bidireccional)
                {
                    var inversa = new ConexionZona
                    {
                       
                        Id = c.Id + "_rev",
                       
                        NodoOrigenId = c.NodoDestinoId,
                       
                        NodoDestinoId = c.NodoOrigenId,
                       
                        DistanciaKm = c.DistanciaKm,
                       
                        TiempoEstimadoMin = c.TiempoEstimadoMin,
                       
                        Bidireccional = false
                    };

                    if (!_adyacencia.ContainsKey(inversa.NodoOrigenId))
                    
                        _adyacencia[inversa.NodoOrigenId] = new List<ConexionZona>();
                    
                    _adyacencia[inversa.NodoOrigenId].Add(inversa);
                }
            }
        }

        /// <summary>Obtiene vecinos de un nodo (para sugerir trayectos alternativos).</summary>
        public IEnumerable<ConexionZona> Vecinos(string nodoId)
        {
            if (_adyacencia == null) ConstruirIndice();
           
            return _adyacencia!.TryGetValue(nodoId, out var lista)
           
                ? lista
           
                : Enumerable.Empty<ConexionZona>();
        }
    }
