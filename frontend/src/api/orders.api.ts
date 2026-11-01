import { http } from './http'

export type DeliveryType = 'Parcel' | 'Documents' | 'Perishable'
export type OrderPriority = 'Low' | 'Medium' | 'Urgent'
export type OrderStatus = 'Pending' | 'InRoute' | 'Delivered' | 'Returned'

export interface OrderSummary {
  id: number
  description: string
  deliveryType: DeliveryType
  priority: OrderPriority
  weightKg: number
  entryDate: string
  deadlineAt: string
  status: OrderStatus
  centerName: string
  zoneName: string
  address: string
}

export interface CreateOrderPayload {
  description: string
  deliveryType: DeliveryType
  priority: OrderPriority
  weightKg: number
  entryDate: string
  deadlineAt: string
  distributionCenterId: number
  stop: {
    address: string
    zoneId: number
  }
}

export const ordersApi = {
  async list(): Promise<OrderSummary[]> {
    const { data } = await http.get<OrderSummary[]>('/orders')
    return data
  },

  async create(payload: CreateOrderPayload): Promise<OrderSummary> {
    const { data } = await http.post<OrderSummary>('/orders', payload)
    return data
  },
}