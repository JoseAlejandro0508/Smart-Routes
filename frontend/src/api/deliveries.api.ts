import { http } from './http'

/** Resultado posible del intento de entrega de un pedido. */
export type DeliveryResult = 'Pending' | 'Successful' | 'Failed'

/** Parada asignada dentro de una ruta de reparto. */
export interface AssignedStop {
  orderId: number
  description: string
  address: string
  zoneName: string
  priority: 'Low' | 'Medium' | 'Urgent'
  result: DeliveryResult
  observations?: string
}

/** Ruta asignada a un repartidor con sus paradas. */
export interface AssignedRoute {
  routeId: number
  scheduledDate: string
  centerName: string
  stops: AssignedStop[]
}

/** Datos para registrar el resultado de una entrega. */
export interface RecordDeliveryPayload {
  result: Exclude<DeliveryResult, 'Pending'>
  observations?: string
}

/** Cliente de API para la operación de entregas del repartidor. */
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