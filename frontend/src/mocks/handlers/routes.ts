// src/mocks/handlers/routes.ts
// Handlers de generación, consulta y validación de rutas.
import { http, HttpResponse } from 'msw'
import type { GenerateRoutePayload, RouteSummary, ReviewRoutePayload } from '../../api/routes.api'
import { authenticatedUser, randomDelay } from '../shared'
import { mockState } from '../state'

/** Handlers de rutas: listado, generación y revisión. */
export const routesHandlers = [
  // GET /api/routes
  http.get('/api/routes', async ({ request }) => {
    await randomDelay()
    try {
      authenticatedUser(request)
      return HttpResponse.json(mockState.routes)
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // POST /api/routes/generate
  http.post('/api/routes/generate', async ({ request }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'LogisticsCoordinator') {
        return HttpResponse.json({ message: 'Solo un coordinador puede generar rutas' }, { status: 403 })
      }
      const payload = (await request.json()) as GenerateRoutePayload
      const route: RouteSummary = {
        id: mockState.nextRouteId++, creationDate: new Date().toISOString(), scheduledDate: payload.scheduledDate,
        vehicleCapacityKg: payload.vehicleCapacityKg, generatorName: user.name,
        centerName: payload.distributionCenterId === 2 ? 'Centro Vedado' : 'Centro Habana',
        status: 'PendingApproval', orderCount: payload.orderIds.length, stopCount: Math.max(1, payload.orderIds.length - 1),
        parameters: [{ label: 'Pedidos seleccionados', value: `${payload.orderIds.length}` }, { label: 'Capacidad', value: `${payload.vehicleCapacityKg} kg` }, { label: 'Cobertura', value: 'Pendiente de cálculo' }],
      }
      mockState.routes.unshift(route)
      return HttpResponse.json(route, { status: 201 })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // POST /api/routes/:id/review
  http.post('/api/routes/:id/review', async ({ request, params }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'OperationsSupervisor') {
        return HttpResponse.json({ message: 'Solo un supervisor puede validar rutas' }, { status: 403 })
      }
      const route = mockState.routes.find((candidate) => candidate.id === Number(params.id))
      if (!route) return HttpResponse.json({ message: 'Ruta no encontrada' }, { status: 404 })

      const payload = (await request.json()) as ReviewRoutePayload
      if (payload.decision === 'Rejected' && !payload.observations?.trim()) {
        return HttpResponse.json({ message: 'La observación es obligatoria al rechazar' }, { status: 400 })
      }
      route.status = payload.decision === 'Approved' ? 'Approved' : 'Rejected'
      return HttpResponse.json(route)
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),
]
