// src/mocks/handlers/reports.ts
// Handler de los reportes operativos.
import { http, HttpResponse } from 'msw'
import type { ReportId } from '../../api/reports.api'
import { authenticatedUser, randomDelay } from '../shared'
import { mockState } from '../state'

/** Handler de reportes por identificador. */
export const reportsHandlers = [
  // GET /api/reports/:reportId
  http.get('/api/reports/:reportId', async ({ request, params }) => {
    await randomDelay()
    try {
      authenticatedUser(request)
      const report = mockState.reports[params.reportId as ReportId]
      if (!report) return HttpResponse.json({ message: 'Reporte no encontrado' }, { status: 404 })
      return HttpResponse.json(report)
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),
]
