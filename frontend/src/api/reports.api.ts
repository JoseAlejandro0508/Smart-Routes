import { http } from './http'

/** Identificadores de los reportes disponibles en el sistema. */
export type ReportId = 'generated-routes' | 'managed-orders' | 'validated-routes' | 'delivery-performance' | 'center-comparison' | 'priority-correlation'
/** Valor permitido en una celda de reporte. */
export type ReportCell = string | number

/** Estructura de datos de un reporte tabular. */
export interface ReportData {
  id: ReportId
  title: string
  description: string
  columns: string[]
  rows: Record<string, ReportCell>[]
}

/** Cliente de API para consultar reportes. */
export const reportsApi = {
  async get(reportId: ReportId): Promise<ReportData> {
    const { data } = await http.get<ReportData>(`/reports/${reportId}`)
    return data
  },
}