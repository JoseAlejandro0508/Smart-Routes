import { http } from './http'
import type { BalanceCriterion } from './balance-criteria.api'
import type { DeliveryType, OrderPriority, OrderStatus } from './orders.api'

/** Decisión de revisión de una ruta. */
export type ReviewDecision = 'Pending' | 'Approved' | 'Rejected'

/** Pedido dentro de una ruta, en orden de visita. */
export interface RouteOrder {
  id: number
  description: string
  deliveryType: DeliveryType
  priority: OrderPriority
  weightKg: number
  deadlineAt: string
  status: OrderStatus
  stopId: number
  stopAddress: string
}

/** Ruta devuelta por el filtro de rutas. */
export interface Route {
  id: number
  scheduledDate: string
  generatorCoordinatorId: string
  distributionCenterId: number
  deliveryPersonId?: string | null
  balanceCriterionId: number
  ordersOrdered: RouteOrder[]
  balanceCriterion?: BalanceCriterion | null
  created: string
  /** Estado derivado de la última revisión (cuando está disponible en cliente). */
}

/** Filtros para consultar rutas. */
export interface RouteFilters {
  scheduleBefore?: string
  scheduleLast?: string
  id?: number
  distributionCenterId?: number
  balanceCriterionId?: number
  deliveryPersonId?: string
  logisticCoordiantorId?: string
  supervisorId?: string
  withStops?: boolean
  withBalanceCriterion?: boolean
  state?: Exclude<ReviewDecision, 'Pending'> | 'Pending'
}

/** Datos para generar una ruta. */
export interface GenerateRoutePayload {
  scheduledDate: string
  deliveryPersonId: string
  distributionCenterId: number
  balanceCriterionId: number
}

/** Resultado de la generación de una ruta. */
export interface GeneratedRoute {
  routeId: number
  orders: RouteOrder[]
}

/** Datos para registrar la revisión de una ruta. */
export interface AddReviewPayload {
  routeId: number
  decision: ReviewDecision
  observations?: string
  newBalanceCriterionId?: number
}

/** Coordenadas/parada del mapa de ruta. */
export interface RouteMapStop {
  stopId: number
  address: string
  latitude?: number | null
  longitude?: number | null
  visitOrder: number
  orders: Array<{
    id: number
    description: string
    priority: OrderPriority
    deliveryType: DeliveryType
    weightKg: number
    deadlineAt: string
    status: OrderStatus
  }>
}

/** Mapa de una ruta con centro, paradas y trazo. */
export interface RouteMap {
  routeId: number
  scheduledDate: string
  center: { id: number; name: string; latitude?: number | null; longitude?: number | null }
  stops: RouteMapStop[]
  /** Trazado por calles: pares [latitud, longitud] listos para Leaflet; `estimated` si es una estimación en línea recta. */
  path?: { latLngs: [number, number][]; distanceMeters: number; durationSeconds: number; source: 'osrm' | 'estimated' } | null
}

/** Cliente de API para rutas de reparto. */
export const routesApi = {
  /** Lista rutas aplicando filtros del backend. */
  async list(filters: RouteFilters = {}): Promise<Route[]> {
    const params = { withStops: true, withBalanceCriterion: true, ...filters }
    const { data } = await http.get<Route[]>('/routes/filter', { params })
    return data
  },

  /** Genera una ruta para un reparto y criterio seleccionados. */
  async generate(payload: GenerateRoutePayload): Promise<GeneratedRoute> {
    const { data } = await http.post<GeneratedRoute>('/routes/generate', payload)
    return data
  },

  /** Registra la revisión de una ruta por el supervisor. */
  async addReview(payload: AddReviewPayload): Promise<void> {
    await http.post('/routes/add-review', payload)
  },

  /** Obtiene el mapa de una ruta. */
  async getMap(routeId: number): Promise<RouteMap> {
    const { data } = await http.get<RouteMap>(`/routes/${routeId}/map`)
    return data
  },
}
