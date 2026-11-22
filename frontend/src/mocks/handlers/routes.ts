// src/mocks/handlers/routes.ts
// Handlers de generación, consulta y validación de rutas.
import { http, HttpResponse } from 'msw'
import type { AddReviewPayload, GenerateRoutePayload } from '../../api/routes.api'
import { authenticatedUser, randomDelay } from '../shared'
import { mockState } from '../state'

/** Handlers de rutas: listado, generación y revisión. */
export const routesHandlers = [
  // GET /api/routes/filter
  http.get('/api/routes/filter', async ({ request }) => {
    await randomDelay()
    try {
      authenticatedUser(request)
      const url = new URL(request.url)
      const state = url.searchParams.get('state')
      let routes = [...(mockState as any).routes]
      if (state) {
        routes = routes.filter((route) => ((mockState as any).routeReviews[route.id] ?? 'Pending') === state)
      }
      return HttpResponse.json(routes)
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
      const id = (mockState as any).nextRouteId++
      const route = {
        id,
        scheduledDate: payload.scheduledDate,
        generatorCoordinatorId: user.id,
        distributionCenterId: payload.distributionCenterId,
        deliveryPersonId: payload.deliveryPersonId,
        balanceCriterionId: payload.balanceCriterionId,
        created: new Date().toISOString(),
        ordersOrdered: [],
        balanceCriterion: null,
      }
      ;(mockState as any).routes.unshift(route)
      ;(mockState as any).routeReviews[id] = 'Pending'
      return HttpResponse.json({ routeId: id, orders: [] }, { status: 201 })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // POST /api/routes/add-review
  http.post('/api/routes/add-review', async ({ request }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'OperationsSupervisor') {
        return HttpResponse.json({ message: 'Solo un supervisor puede validar rutas' }, { status: 403 })
      }
      const payload = (await request.json()) as AddReviewPayload
      const route = (mockState as any).routes.find((candidate: any) => candidate.id === payload.routeId)
      if (!route) return HttpResponse.json({ message: 'Ruta no encontrada' }, { status: 404 })
      if (payload.decision === 'Rejected' && !payload.observations?.trim()) {
        return HttpResponse.json({ message: 'La observación es obligatoria al rechazar' }, { status: 400 })
      }
      ;(mockState as any).routeReviews[payload.routeId] = payload.decision === 'Approved' ? 'Approved' : 'Rejected'
      return new HttpResponse(null, { status: 200 })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // GET /api/routes/:id/map
  http.get('/api/routes/:id/map', async ({ request, params }) => {
    await randomDelay()
    try {
      authenticatedUser(request)
      // Puntos reales de La Habana; el backend real calcula el trazado por calles con OSRM.
      const center = { latitude: 23.132, longitude: -82.374 }
      const places = [
        { address: 'Calle 12 #78', latitude: 23.125, longitude: -82.395, priority: 'Urgent' },
        { address: 'Avenida 5ta #120', latitude: 23.128, longitude: -82.389, priority: 'Medium' },
        { address: 'Calle 23 #456', latitude: 23.136, longitude: -82.381, priority: 'Low' },
      ] as const
      const stops = places.map((place, index) => ({
        stopId: index + 1,
        address: place.address,
        zoneId: index + 1,
        latitude: place.latitude,
        longitude: place.longitude,
        visitOrder: index + 1,
        orders: [{ id: Number(params.id) * 100 + index, description: `Pedido ${index + 1}`, priority: place.priority, deliveryType: 'Parcel', weightKg: 2 + index, deadlineAt: new Date().toISOString(), status: 'InRoute' }],
      }))
      const latLngs: [number, number][] = [[center.latitude, center.longitude], ...places.map((p) => [p.latitude, p.longitude] as [number, number]), [center.latitude, center.longitude]]
      return HttpResponse.json({
        routeId: Number(params.id),
        scheduledDate: new Date().toISOString(),
        center: { id: 1, name: 'Centro Habana', ...center },
        stops,
        path: { latLngs, distanceMeters: 8700, durationSeconds: 1080, source: 'estimated' },
      })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),
]
