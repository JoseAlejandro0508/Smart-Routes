    using System.Collections.Generic;
    using System.Linq;
    namespace Smart-Routes.Domain.Graph

    /// <summary>
    /// Calcula la ruta más corta entre dos nodos usando Dijkstra.
    /// </summary>
    /// <param name="origenId">Nodo de origen.</param>
    /// <param name="destinoId">Nodo de destino.</param>
    /// <param name="porTiempo">true = optimiza tiempo; false = optimiza distancia.</param>
    /// <returns>Lista de conexiones que forman el camino, o null si no hay ruta.</returns>
    
    public List<ConexionZona>? CaminoMasCortoDijkstra(string origenId, string destinoId, bool porTiempo = true)
    {
            
        if (_adyacencia == null) ConstruirIndice();
            
        if (!_nodosPorId!.ContainsKey(origenId) || !_nodosPorId.ContainsKey(destinoId))
            
            return null;

        
        var dist = new Dictionary<string, double>();
        
        var prev = new Dictionary<string, ConexionZona?>();
        
        var visitados = new HashSet<string>();

        foreach (var n in Nodos)
        {
        
                dist[n.Id] = double.PositiveInfinity;
        
                prev[n.Id] = null;
        }
    
            dist[origenId] = 0;

        // Cola de prioridad simple (para grafos académicos pequeños)
        var cola = new PriorityQueue<string, double>();
    
        cola.Enqueue(origenId, 0);

        while (cola.Count > 0)
        {
            
            var actual = cola.Dequeue();
            
            if (visitados.Contains(actual)) continue;
            
            visitados.Add(actual);

            if (actual == destinoId) break;

            foreach (var conexion in Vecinos(actual))
            {
                var peso = porTiempo ? conexion.TiempoEstimadoMin : conexion.DistanciaKm;
                var nuevoCosto = dist[actual] + peso;

                if (nuevoCosto < dist[conexion.NodoDestinoId])
                {
                
                    dist[conexion.NodoDestinoId] = nuevoCosto;
                
                    prev[conexion.NodoDestinoId] = conexion;
                
                    cola.Enqueue(conexion.NodoDestinoId, nuevoCosto);
                
                }
                
            }
            
        }

        if (double.IsPositiveInfinity(dist[destinoId])) return null;

        // Reconstruir camino
        var camino = new List<ConexionZona>();
        
        var cursor = destinoId;
        
        while (prev[cursor] != null)
        {
        
            camino.Insert(0, prev[cursor]!);
        
            cursor = prev[cursor]!.NodoOrigenId;
        
        }
        
        return camino;
        
    }

    /// <summary>
    /// Devuelve hasta K caminos alternativos entre origen y destino.
    /// Útil para sugerir trayectos cuando una entrega no puede completarse.
    /// </summary>
    public List<List<ConexionZona>> CaminosAlternativos(string origenId,
    string destinoId, int k = 3, bool porTiempo = true)
    {
        var resultados = new List<List<ConexionZona>>();

        var primero = CaminoMasCorto(origenId, destinoId, porTiempo);
        if (primero == null) return resultados;
        resultados.Add(primero);

        // Versión simplificada: elimina una arista del camino encontrado
        // y recalcula. Para producción usar Yen completo o A* con heurística.
        foreach (var arista in primero)
        {
            
            var conexionesBackup = new List<ConexionZona>(Conexiones);
            
            Conexiones.RemoveAll(c =>
            
            c.NodoOrigenId == arista.NodoOrigenId &&
            
            c.NodoDestinoId == arista.NodoDestinoId);
            
            ConstruirIndice();

            
            var alterno = CaminoMasCorto(origenId, destinoId, porTiempo);
            
            if (alterno != null && !resultados.Any(r => MismoCamino(r, alterno)))
                resultados.Add(alterno);

                
                Conexiones.Clear();
                
                Conexiones.AddRange(conexionesBackup);
                
                ConstruirIndice();

                if (resultados.Count >= k) break;

            
            
        }

            return resultados;
        }

        private static bool MismoCamino(List<ConexionZona> a, List<ConexionZona> b)
        {
            
            if (a.Count != b.Count) return false;
            
            for (int i = 0; i < a.Count; i++)
            {

                if (a[i].NodoOrigenId != b[i].NodoOrigenId ||
            
                    a[i].NodoDestinoId != b[i].NodoDestinoId)
            
                    return false;
            
            }
            return true;
        
        }
    

