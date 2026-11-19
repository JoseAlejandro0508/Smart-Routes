// src/mocks/handlers/deliveries.ts
// Handlers de la operación del repartidor sobre sus rutas asignadas.
import { http, HttpResponse } from 'msw'
import type { RecordDeliveryPayload } from '../../api/deliveries.api'
import { authenticatedUser, randomDelay } from '../shared'
import { mockState } from '../state'

/** Handlers de entregas: consulta de rutas asignadas y registro de paradas. */
export const deliveriesHandlers = [
  // GET /api/delivery/routes
  http.get('/api/delivery/routes', async ({ request }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'DeliveryPerson') return HttpResponse.json({ message: 'Solo un repartidor puede consultar sus rutas' }, { status: 403 })
      return HttpResponse.json(mockState.assignedRoutes)
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // POST /api/delivery/routes/:routeId/stops/:orderId
  http.post('/api/delivery/routes/:routeId/stops/:orderId', async ({ request, params }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'DeliveryPerson') return HttpResponse.json({ message: 'Solo un repartidor puede registrar entregas' }, { status: 403 })
      const route = mockState.assignedRoutes.find((candidate) => candidate.routeId === Number(params.routeId))
      const stop = route?.stops.find((candidate) => candidate.orderId === Number(params.orderId))
      if (!stop) return HttpResponse.json({ message: 'Parada no encontrada' }, { status: 404 })
      if (stop.result !== 'Pending') return HttpResponse.json({ message: 'Esta entrega ya fue registrada' }, { status: 409 })
      const payload = (await request.json()) as RecordDeliveryPayload
      if (payload.result === 'Failed' && !payload.observations?.trim()) return HttpResponse.json({ message: 'Indica el motivo de la entrega fallida' }, { status: 400 })
      stop.result = payload.result
      stop.observations = payload.observations
      return HttpResponse.json(stop)
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),
]
