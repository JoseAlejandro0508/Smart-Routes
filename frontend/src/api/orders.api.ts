import { http } from './http'

/** Tipo de entrega asociado a un pedido. */
export type DeliveryType = 'Parcel' | 'Documents' | 'Perishable'
/** Nivel de prioridad de un pedido. */
export type OrderPriority = 'Low' | 'Medium' | 'Urgent'
/** Estado actual de un pedido en el flujo logístico. */
export type OrderStatus = 'Pending' | 'InRoute' | 'Delivered' | 'Returned'

/** Pedido devuelto por la API. */
export interface Order {
  id: number
  description: string
  deliveryType: DeliveryType
  priority: OrderPriority
  weightKg: number
  entryDate: string
  deadlineAt: string
  status: OrderStatus
  distributionCenterId: number
  stopId: number
  centerName: string
  zoneName: string
  address: string
}

/** Página de pedidos paginada. */
export interface OrdersPage {
  items: Order[]
  pageNumber: number
  pageSize: number
  totalCount: number
}

/** Filtros y paginación para listar pedidos. */
export interface ListOrdersParams {
  distributionCenterId?: number
  zoneId?: number
  deliveryType?: DeliveryType
  priority?: OrderPriority
  status?: OrderStatus
  pageNumber?: number
  pageSize?: number
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
  stopId?: number
  stop?: {
    address: string
    zoneId: number
  }
}

/** Cliente de API para la gestión de pedidos. */
export const ordersApi = {
  /** Lista pedidos aplicando filtros y paginación del backend. */
  async list(params: ListOrdersParams = {}): Promise<OrdersPage> {
    const { data } = await http.get<OrdersPage>('/orders', { params })
    return data
  },

  /** Registra un pedido y devuelve su identificador. */
  async create(payload: CreateOrderPayload): Promise<number> {
    const { data } = await http.post<number>('/orders', payload)
    return data
  },
}
