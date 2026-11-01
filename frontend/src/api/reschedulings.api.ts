import { http } from './http'

export type ReschedulingStatus = 'Pending' | 'InProgress' | 'Resolved'
export type ManualResolution = 'Reassigned' | 'Rescheduled' | 'ReturnedToWarehouse'

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

export interface CreateReschedulingPayload {
  routeId: number
  orderId: number
  reason: string
  resolverCoordinatorId: string
}

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