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