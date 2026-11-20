import { http } from './http'

/** Tipo de entrega asociado a un pedido. */
export type DeliveryType = 'Parcel' | 'Documents' | 'Perishable'
/** Nivel de prioridad de un pedido. */
export type OrderPriority = 'Low' | 'Medium' | 'Urgent'
/** Estado actual de un pedido en el flujo logístico. */
export type OrderStatus = 'Pending' | 'InRoute' | 'Delivered' | 'Returned'

/** Resumen de un pedido para listados y detalle. */
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

/** Datos necesarios para registrar un nuevo pedido. */
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

/** Cliente de API para la gestión de pedidos. */
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