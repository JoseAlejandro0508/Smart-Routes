import { http } from './http'

export interface DashboardSummary {
  totalOrders: number
  activeRoutes: number
  pendingDeliveries: number
  completedDeliveries: number
  generatedAt: string
}

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const { data } = await http.get<DashboardSummary>('/dashboard/summary')
    return data
  },
}