import { http } from './http'

/** Estado de una solicitud de reprogramación. */
export type ReschedulingStatus = 'Pending' | 'InProgress' | 'Resolved'
/** Resolución manual posible para una reprogramación. */
export type ManualResolution = 'Reassigned' | 'Rescheduled' | 'ReturnedToWarehouse'

/** Solicitud de reprogramación asociada a un pedido/ruta. */
export interface ReschedulingRequest {
  id: number
  routeId: number
  orderId: number
  orderDescription: string
  reason: string
  requestDate: string
  status: ReschedulingStatus
  manualResult?: ManualResolution
  resolverCoordinatorId: string
  resolverCoordinatorName: string
}

/** Datos para crear una solicitud de reprogramación. */
export interface CreateReschedulingPayload {
  routeId: number
  orderId: number
  reason: string
  resolverCoordinatorId: string
}

/** Cliente de API para solicitudes de reprogramación. */
export const reschedulingsApi = {
  async list(): Promise<ReschedulingRequest[]> {
    const { data } = await http.get<ReschedulingRequest[]>('/reschedulings')
    return data
  },

  async create(payload: CreateReschedulingPayload): Promise<ReschedulingRequest> {
    const { data } = await http.post<ReschedulingRequest>('/reschedulings', payload)
    return data
  },

  async resolve(requestId: number, manualResult: ManualResolution): Promise<ReschedulingRequest> {
    const { data } = await http.post<ReschedulingRequest>(`/reschedulings/${requestId}/resolve`, { manualResult })
    return data
  },
}