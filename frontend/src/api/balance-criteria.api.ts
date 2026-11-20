import { http } from './http'
import type { DeliveryType } from './orders.api'

/** Métrica evaluada por un parámetro de equilibrio. */
export type BalanceMetric =
  | 'OrderCount'
  | 'DeliveryTypeProportion'
  | 'ZoneCount'
  | 'TotalWeight'
  | 'StopCount'

/** Operador de comparación del parámetro. */
export type ComparisonOperator = 'LessThanOrEqual' | 'GreaterThanOrEqual' | 'Equal'

/** Parámetro de un criterio de equilibrio. */
export interface BalanceParameter {
  id: number
  name: string
  metric: BalanceMetric
  operator: ComparisonOperator
  appliedValue: number
  targetDeliveryType?: DeliveryType | null
  balanceCriterionId: number
}

/** Criterio de equilibrio con sus parámetros. */
export interface BalanceCriterion {
  id: number
  name: string
  description?: string | null
  authorCoordinatorId?: string | null
  isPredefined: boolean
  parameters: BalanceParameter[]
}

/** Parámetro a registrar al crear un criterio. */
export interface CreateBalanceParameterPayload {
  name: string
  metric: BalanceMetric
  operator: ComparisonOperator
  appliedValue: number
  deliveryType?: DeliveryType
}

/** Datos para crear un criterio de equilibrio. */
export interface CreateBalanceCriterionPayload {
  name: string
  description: string
  customBalancedParameters: CreateBalanceParameterPayload[]
}

/** Cliente de API para criterios de equilibrio de rutas. */
export const balanceCriteriaApi = {
  /** Lista todos los criterios disponibles. */
  async list(): Promise<BalanceCriterion[]> {
    const { data } = await http.get<BalanceCriterion[]>('/balance-criteria/get-all')
    return data
  },

  /** Crea un criterio con sus parámetros y devuelve su identificador. */
  async create(payload: CreateBalanceCriterionPayload): Promise<number> {
    const { data } = await http.post<number>('/balance-criteria/create-balance-criterion', payload)
    return data
  },

  /** Elimina un criterio y sus parámetros. */
  async remove(id: number): Promise<void> {
    await http.delete(`/balance-criteria/${id}`)
  },
}
