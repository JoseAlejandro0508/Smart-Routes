// src/mocks/handlers/reschedulings.ts
// Handlers de solicitudes de reprogramación.
import { http, HttpResponse } from 'msw'
import type { CreateReschedulingPayload, ManualResolution, ReschedulingRequest } from '../../api/reschedulings.api'
import { authenticatedUser, randomDelay } from '../shared'
import { mockState } from '../state'

/** Handlers de reprogramaciones: listado, solicitud y resolución. */
export const reschedulingsHandlers = [
  // GET /api/reschedulings
  http.get('/api/reschedulings', async ({ request }) => {
    await randomDelay()
    try {
      authenticatedUser(request)
      return HttpResponse.json(mockState.reschedulings)
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // POST /api/reschedulings
  http.post('/api/reschedulings', async ({ request }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'DeliveryPerson') return HttpResponse.json({ message: 'Solo un repartidor puede solicitar una reprogramación' }, { status: 403 })
      const payload = (await request.json()) as CreateReschedulingPayload
      if (!payload.reason.trim() || !payload.resolverCoordinatorId) return HttpResponse.json({ message: 'Motivo y coordinador son obligatorios' }, { status: 400 })
      const requestItem: ReschedulingRequest = {
        id: mockState.nextReschedulingId++, routeId: payload.routeId, orderId: payload.orderId,
        orderDescription: mockState.assignedRoutes.flatMap((route) => route.stops).find((stop) => stop.orderId === payload.orderId)?.description ?? `Pedido #${payload.orderId}`,
        reason: payload.reason, requestDate: new Date().toISOString(), status: 'Pending',
        resolverCoordinatorId: payload.resolverCoordinatorId, resolverCoordinatorName: 'Ana Demo',
      }
      mockState.reschedulings.unshift(requestItem)
      return HttpResponse.json(requestItem, { status: 201 })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // POST /api/reschedulings/:id/resolve
  http.post('/api/reschedulings/:id/resolve', async ({ request, params }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'LogisticsCoordinator') return HttpResponse.json({ message: 'Solo un coordinador puede resolver la solicitud' }, { status: 403 })
      const requestItem = mockState.reschedulings.find((item) => item.id === Number(params.id))
      if (!requestItem) return HttpResponse.json({ message: 'Solicitud no encontrada' }, { status: 404 })
      const { manualResult } = (await request.json()) as { manualResult: ManualResolution }
      requestItem.status = 'Resolved'
      requestItem.manualResult = manualResult
      return HttpResponse.json(requestItem)
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),
]
