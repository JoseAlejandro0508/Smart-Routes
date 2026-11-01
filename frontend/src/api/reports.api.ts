import { http } from './http'

export type ReportId = 'generated-routes' | 'managed-orders' | 'validated-routes' | 'delivery-performance' | 'center-comparison' | 'priority-correlation'
export type ReportCell = string | number

export interface ReportData {
  id: ReportId
  title: string
  description: string
  columns: string[]
  rows: Record<string, ReportCell>[]
}

export const reportsApi = {
  async get(reportId: ReportId): Promise<ReportData> {
    const { data } = await http.get<ReportData>(`/reports/${reportId}`)
    return data
  },
}