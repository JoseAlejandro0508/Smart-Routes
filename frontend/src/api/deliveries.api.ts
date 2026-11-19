import { http } from './http'

export type DeliveryResult = 'Pending' | 'Successful' | 'Failed'

export interface AssignedStop {
  orderId: number
  description: string
  address: string
  zoneName: string
  priority: 'Low' | 'Medium' | 'Urgent'
  result: DeliveryResult
  observations?: string
}

export interface AssignedRoute {
  routeId: number
  scheduledDate: string
  centerName: string
  stops: AssignedStop[]
}

export interface RecordDeliveryPayload {
  result: Exclude<DeliveryResult, 'Pending'>
  observations?: string
}

export const deliveriesApi = {
  async listAssignedRoutes(): Promise<AssignedRoute[]> {
    const { data } = await http.get<AssignedRoute[]>('/delivery/routes')
    return data
  },

  async record(routeId: number, orderId: number, payload: RecordDeliveryPayload): Promise<AssignedStop> {
    const { data } = await http.post<AssignedStop>(`/delivery/routes/${routeId}/stops/${orderId}`, payload)
    return data
  },
}