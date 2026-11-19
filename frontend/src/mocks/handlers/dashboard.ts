// src/mocks/handlers/dashboard.ts
// Handlers del resumen operativo del dashboard.
import { http, HttpResponse } from 'msw'
import { db } from '../db'
import { randomDelay } from '../shared'

/** Handler del resumen del dashboard, adaptado al rol del usuario autenticado. */
export const dashboardHandlers = [
  // GET /api/dashboard/summary
  http.get('/api/dashboard/summary', async ({ request }) => {
    await randomDelay()
    const auth = request.headers.get('Authorization') ?? ''
    const token = auth.replace('Bearer ', '')

    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { sub?: string }
      const user = db.users.find((candidate) => candidate.id === payload.sub)
      if (!user) throw new Error('no user')

      const summaries = {
        Administrator: { totalOrders: 248, activeRoutes: 18, pendingDeliveries: 42, completedDeliveries: 186 },
        LogisticsCoordinator: { totalOrders: 86, activeRoutes: 7, pendingDeliveries: 15, completedDeliveries: 64 },
        OperationsSupervisor: { totalOrders: 124, activeRoutes: 11, pendingDeliveries: 22, completedDeliveries: 96 },
        DeliveryPerson: { totalOrders: 18, activeRoutes: 2, pendingDeliveries: 5, completedDeliveries: 11 },
      }[user.role]

      return HttpResponse.json({ ...summaries, generatedAt: new Date().toISOString() })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),
]
