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
    const response = await http.get<Order[] | OrdersPage>('/orders', { params })
    const { data, headers } = response

    // El backend real devuelve un array y los totales en cabeceras. Se acepta
    // también una respuesta paginada por compatibilidad con versiones previas
    // del contrato.
    if (!Array.isArray(data)) return data

    const numericHeader = (name: string) => {
      const value = headers[name]
      const parsed = typeof value === 'string' ? Number(value) : Number.NaN
      return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
    }

    return {
      items: data,
      pageNumber: numericHeader('x-page-number') ?? params.pageNumber ?? 1,
      pageSize: numericHeader('x-page-size') ?? params.pageSize ?? 20,
      totalCount: numericHeader('x-total-count') ?? data.length,
    }
  },

  /** Registra un pedido y devuelve el pedido creado. */
  async create(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await http.post<Order>('/orders', payload)
    return data
  },
}
