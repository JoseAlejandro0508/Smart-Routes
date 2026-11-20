import { http } from './http'

/** Estado de una ruta dentro del flujo de generación y revisión. */
export type RouteStatus = 'PendingApproval' | 'Approved' | 'Rejected' | 'InModification'

/** Parámetro aplicado o evaluado para una ruta. */
export interface RouteParameter {
  label: string
  value: string
}

/** Resumen de una ruta con sus datos principales. */
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

/** Datos para solicitar la generación de una ruta. */
export interface GenerateRoutePayload {
  scheduledDate: string
  vehicleCapacityKg: number
  distributionCenterId: number
  orderIds: number[]
}

/** Decisión posible al revisar una ruta. */
export type ReviewDecision = 'Approved' | 'Rejected'

/** Datos para registrar la revisión de una ruta. */
export interface ReviewRoutePayload {
  decision: ReviewDecision
  observations?: string
}

/** Cliente de API para la gestión de rutas. */
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
}