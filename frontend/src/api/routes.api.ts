import { http } from './http'

export type RouteStatus = 'PendingApproval' | 'Approved' | 'Rejected' | 'InModification'

export interface RouteParameter {
  label: string
  value: string
}

export interface RouteSummary {
  id: number
  creationDate: string
  scheduledDate: string
  vehicleCapacityKg: number
  generatorName: string
  centerName: string
  status: RouteStatus
  orderCount: number
  stopCount: number
  deliveryPersonName?: string
  parameters: RouteParameter[]
}

export interface GenerateRoutePayload {
  scheduledDate: string
  vehicleCapacityKg: number
  distributionCenterId: number
  orderIds: number[]
}

export type ReviewDecision = 'Approved' | 'Rejected'

export interface ReviewRoutePayload {
  decision: ReviewDecision
  observations?: string
}

/** Prioridad de un pedido. El backend .NET la envía como número (0, 1, 2) y el mock como texto. */
export type MapOrderPriority = 'Low' | 'Medium' | 'Urgent' | 0 | 1 | 2

/** Pedido entregado en una parada del mapa. */
export interface RouteMapOrder {
  id: number
  description: string
  priority: MapOrderPriority
  deliveryType: string | number
  weightKg: number
  deadlineAt: string
  status: string | number
}

/** Parada de la ruta, en orden de visita. Latitud y longitud son null si no se pudo ubicar. */
export interface RouteMapStop {
  visitOrder: number
  stopId: number
  address: string
  zoneId: number
  latitude: number | null
  longitude: number | null
  orders: RouteMapOrder[]
}

/** Trazado por calles. `latLngs` son pares [latitud, longitud], listos para Leaflet. */
export interface RouteMapPath {
  latLngs: [number, number][]
  distanceMeters: number
  durationSeconds: number
  /** `osrm` si sigue las calles reales; `estimated` si es una estimación en línea recta. */
  source: 'osrm' | 'estimated'
}

/** Datos para dibujar una ruta: centro de salida, paradas y trazado (GET /api/routes/{id}/map). */
export interface RouteMap {
  routeId: number
  scheduledDate: string
  center: { id: number; name: string; latitude: number | null; longitude: number | null }
  stops: RouteMapStop[]
  path: RouteMapPath | null
}

export const routesApi = {
  async list(): Promise<RouteSummary[]> {
    const { data } = await http.get<RouteSummary[]>('/routes')
    return data
  },

  async generate(payload: GenerateRoutePayload): Promise<RouteSummary> {
    const { data } = await http.post<RouteSummary>('/routes/generate', payload)
    return data
  },

  async review(routeId: number, payload: ReviewRoutePayload): Promise<RouteSummary> {
    const { data } = await http.post<RouteSummary>(`/routes/${routeId}/review`, payload)
    return data
  },

  /** Centro, paradas en orden de visita y trazado por calles (OSRM sobre OpenStreetMap). */
  async map(routeId: number): Promise<RouteMap> {
    const { data } = await http.get<RouteMap>(`/routes/${routeId}/map`)
    return data
  },
}