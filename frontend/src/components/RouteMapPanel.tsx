import { useQuery } from '@tanstack/react-query'
import { Map as MapIcon } from 'lucide-react'
import { routesApi } from '../api/routes.api'
import { RouteMap } from './RouteMap'

/**
 * Carga el mapa de una ruta (GET /api/routes/{id}/map) y lo muestra con sus estados de carga y error.
 * El trazado se guarda en caché unos minutos porque calcularlo llama al servicio de rutas OSRM.
 */
export function RouteMapPanel({ routeId }: { routeId: number }) {
  const map = useQuery({
    queryKey: ['routes', routeId, 'map'],
    queryFn: () => routesApi.map(routeId),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <section className="mt-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
        <MapIcon className="h-4 w-4 text-neutral-500" /> Recorrido
      </h3>
      <div className="mt-3">
        {map.isPending ? (
          <div className="flex h-[320px] items-center justify-center rounded-xl bg-neutral-50 text-sm text-neutral-500">Calculando el recorrido…</div>
        ) : map.isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">No se pudo cargar el mapa de la ruta.</div>
        ) : map.data.stops.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">Esta ruta todavía no tiene paradas.</div>
        ) : (
          <RouteMap data={map.data} />
        )}
      </div>
    </section>
  )
}
