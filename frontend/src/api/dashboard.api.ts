import { http } from './http'

/** Indicadores resumidos mostrados en el panel principal. */
export interface DashboardSummary {
  totalOrders: number
  activeRoutes: number
  pendingDeliveries: number
  completedDeliveries: number
  generatedAt: string
}

/** Cliente de API para los datos del dashboard. */
export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const { data } = await http.get<DashboardSummary>('/dashboard/summary')
    return data
  },
}