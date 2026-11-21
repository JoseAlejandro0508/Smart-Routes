import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L, { type LatLngExpression, type LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { RouteMap as RouteMapData, RouteMapStop } from '../api/routes.api'

/** Centro de La Habana, usado solo cuando la ruta no tiene ningún punto ubicado. */
const DEFAULT_CENTER: LatLngTuple = [23.1136, -82.3666]

const priorityLabel: Record<string, string> = { Low: 'Baja', Medium: 'Media', Urgent: 'Urgente', 0: 'Baja', 1: 'Media', 2: 'Urgente' }
const priorityRank: Record<string, number> = { Low: 0, Medium: 1, Urgent: 2, 0: 0, 1: 1, 2: 2 }
const priorityColor = ['#0ea5e9', '#f59e0b', '#e11d48']

/** Prioridad más alta entre los pedidos de una parada (0 baja, 1 media, 2 urgente). */
function highestPriority(stop: RouteMapStop): number {
  return Math.max(0, ...stop.orders.map((order) => priorityRank[String(order.priority)] ?? 0))
}

/** Marcador redondo con el número de visita; el color indica la prioridad más alta de la parada. */
function stopIcon(visitOrder: number, priority: number) {
  return L.divIcon({
    className: '',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:${priorityColor[priority]};color:#fff;font:600 12px system-ui;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">${visitOrder}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
}

/** Marcador cuadrado del centro de distribución, donde empieza y termina la ruta. */
const centerIcon = L.divIcon({
  className: '',
  html: '<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;background:#171717;color:#fff;font:600 11px system-ui;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">CD</span>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
})

/**
 * Ajusta el encuadre para que se vean todos los puntos de la ruta.
 * Vuelve a encuadrar cuando cambia el tamaño del contenedor: si el mapa se monta oculto o en un
 * panel que aún no tiene ancho, Leaflet calcularía el zoom con tamaño 0 y quedaría en zoom máximo.
 */
function FitToPoints({ points }: { points: LatLngTuple[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return

    const fit = () => {
      map.invalidateSize()
      if (points.length === 1) map.setView(points[0], 15)
      else map.fitBounds(L.latLngBounds(points), { padding: [30, 30] })
    }

    fit()
    // ResizeObserver no existe en algunos entornos (navegadores antiguos, jsdom en las pruebas).
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(fit)
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map, points])
  return null
}

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`
}

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60)
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`
}

/**
 * Mapa de una ruta con Leaflet y teselas de OpenStreetMap: el centro de distribución,
 * las paradas numeradas en orden de visita y el trazado por calles calculado con OSRM.
 */
export function RouteMap({ data, height = 320 }: { data: RouteMapData; height?: number }) {
  // Memoized so the map is only re-framed when the route data changes, not on every render.
  const located = useMemo(
    () => data.stops.filter((stop) => stop.latitude != null && stop.longitude != null),
    [data.stops],
  )
  const missing = data.stops.length - located.length
  const center = useMemo<LatLngTuple | null>(
    () => (data.center.latitude != null && data.center.longitude != null ? [data.center.latitude, data.center.longitude] : null),
    [data.center.latitude, data.center.longitude],
  )

  const points = useMemo<LatLngTuple[]>(() => {
    const stopPoints = located.map((stop) => [stop.latitude!, stop.longitude!] as LatLngTuple)
    return center ? [center, ...stopPoints] : stopPoints
  }, [located, center])

  // Sin trazado del servidor, se unen los puntos en orden para que al menos se vea la secuencia.
  const line: LatLngExpression[] = data.path?.latLngs ?? (center ? [...points, center] : points)

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-neutral-200" style={{ height }}>
        <MapContainer center={points[0] ?? DEFAULT_CENTER} zoom={13} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {line.length > 1 && (
            <Polyline
              positions={line}
              pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.8, dashArray: data.path?.source === 'osrm' ? undefined : '6 8' }}
            />
          )}
          {center && (
            <Marker position={center} icon={centerIcon}>
              <Popup>
                <p className="font-semibold">{data.center.name}</p>
                <p>Centro de distribución: salida y regreso</p>
              </Popup>
            </Marker>
          )}
          {located.map((stop) => (
            <Marker key={stop.stopId} position={[stop.latitude!, stop.longitude!]} icon={stopIcon(stop.visitOrder, highestPriority(stop))}>
              <Popup>
                <p className="font-semibold">
                  {stop.visitOrder}. {stop.address}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {stop.orders.map((order) => (
                    <li key={order.id}>
                      #{order.id} {order.description} · {priorityLabel[String(order.priority)] ?? order.priority} · {order.weightKg} kg
                    </li>
                  ))}
                </ul>
              </Popup>
            </Marker>
          ))}
          <FitToPoints points={points} />
        </MapContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
        {data.path && (
          <span>
            {formatDistance(data.path.distanceMeters)} · {formatDuration(data.path.durationSeconds)}
            {data.path.source === 'estimated' && ' (estimado en línea recta)'}
          </span>
        )}
        <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full" style={{ background: priorityColor[2] }} />Urgente</span>
        <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full" style={{ background: priorityColor[1] }} />Media</span>
        <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full" style={{ background: priorityColor[0] }} />Baja</span>
      </div>
      {missing > 0 && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {missing === 1 ? '1 parada no tiene' : `${missing} paradas no tienen`} coordenadas y no aparece{missing === 1 ? '' : 'n'} en el mapa.
        </p>
      )}
    </div>
  )
}
