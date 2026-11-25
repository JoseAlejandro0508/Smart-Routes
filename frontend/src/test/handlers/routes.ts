import { http, HttpResponse } from 'msw'
import type { AddReviewPayload, GenerateRoutePayload, Route } from '../../api/routes.api'
import { testDb } from './data'
import { badRequest, isAuthorized, notFound, unauthorized } from './shared'

function reviewStateOf(routeId: number) {
  return testDb.reviews[routeId] ?? 'Pending'
}

function routeById(routeId: number) {
  return testDb.routes.find((route) => route.id === routeId)
}

/** Handlers de rutas fieles al contrato de `docs/endpoints.md`. */
export const routesHandlers = [
  http.get('/api/routes/filter', ({ request }) => {
    if (!isAuthorized(request)) return unauthorized()

    const url = new URL(request.url)
    const state = url.searchParams.get('state')
    const withStops = url.searchParams.get('withStops') !== 'false'
    const withBalanceCriterion = url.searchParams.get('withBalanceCriterion') !== 'false'

    if (state && !['Pending', 'Approved', 'Rejected'].includes(state)) {
      return badRequest('state debe ser Pending, Approved o Rejected.')
    }

    let routes = [...testDb.routes]
    if (state) {
      routes = routes.filter((route) => reviewStateOf(route.id) === state)
    }

    const scheduleBefore = url.searchParams.get('scheduleBefore')
    if (scheduleBefore) {
      const limit = new Date(scheduleBefore).getTime()
      routes = routes.filter((route) => new Date(route.scheduledDate).getTime() <= limit)
    }

    const scheduleLast = url.searchParams.get('scheduleLast')
    if (scheduleLast) {
      const limit = new Date(scheduleLast).getTime()
      routes = routes.filter((route) => new Date(route.scheduledDate).getTime() >= limit)
    }

    const id = url.searchParams.get('id')
    if (id) routes = routes.filter((route) => route.id === Number(id))

    const distributionCenterId = url.searchParams.get('distributionCenterId')
    if (distributionCenterId) {
      routes = routes.filter((route) => route.distributionCenterId === Number(distributionCenterId))
    }

    const balanceCriterionId = url.searchParams.get('balanceCriterionId')
    if (balanceCriterionId) {
      routes = routes.filter((route) => route.balanceCriterionId === Number(balanceCriterionId))
    }

    const deliveryPersonId = url.searchParams.get('deliveryPersonId')
    if (deliveryPersonId) {
      routes = routes.filter((route) => route.deliveryPersonId === deliveryPersonId)
    }

    const coordinatorId = url.searchParams.get('logisticCoordiantorId')
    if (coordinatorId) {
      routes = routes.filter((route) => route.generatorCoordinatorId === coordinatorId)
    }

    return HttpResponse.json(
      routes.map((route) => ({
        ...route,
        ordersOrdered: withStops ? route.ordersOrdered : [],
        balanceCriterion: withBalanceCriterion ? route.balanceCriterion : null,
      })),
    )
  }),

  http.post('/api/routes/generate', async ({ request }) => {
    if (!isAuthorized(request)) return unauthorized()

    const payload = (await request.json()) as GenerateRoutePayload
    if (
      !payload.scheduledDate ||
      !payload.deliveryPersonId ||
      !payload.distributionCenterId ||
      !payload.balanceCriterionId
    ) {
      return badRequest('Fecha, repartidor, centro y criterio son obligatorios.')
    }

    const id = testDb.nextRouteId++
    const route: Route = {
      id,
      scheduledDate: payload.scheduledDate,
      generatorCoordinatorId: '11111111-1111-1111-1111-111111111111',
      distributionCenterId: payload.distributionCenterId,
      deliveryPersonId: payload.deliveryPersonId,
      balanceCriterionId: payload.balanceCriterionId,
      created: new Date().toISOString(),
      ordersOrdered: [],
      balanceCriterion: null,
    }
    testDb.routes.unshift(route)

    return HttpResponse.json({ routeId: id, orders: [] })
  }),

  http.post('/api/routes/add-review', async ({ request }) => {
    if (!isAuthorized(request)) return unauthorized()

    const payload = (await request.json()) as AddReviewPayload & {
      balanceCritertiaId?: number
      balanceCriteria?: unknown
    }

    if (payload.decision !== 'Approved' && payload.decision !== 'Rejected') {
      return badRequest('La decisión debe ser Approved o Rejected.')
    }
    if (payload.decision === 'Rejected' && !payload.observations?.trim()) {
      return badRequest('La observación es obligatoria al rechazar la ruta.')
    }
    if (!routeById(payload.routeId)) {
      return notFound('La ruta no existe.')
    }

    testDb.reviews[payload.routeId] = payload.decision
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/routes/:routeId/map', ({ request, params }) => {
    if (!isAuthorized(request)) return unauthorized()

    const route = routeById(Number(params.routeId))
    if (!route) return notFound('La ruta no existe.')

    const center = testDb.centers.find((candidate) => candidate.id === route.distributionCenterId)
    if (!center) return notFound('El centro de la ruta no existe.')

    const stops = route.ordersOrdered.reduce<
      Array<{
        stopId: number
        address: string
        zoneId: number
        latitude: number | null
        longitude: number | null
        visitOrder: number
        orders: Array<{
          id: number
          description: string
          priority: Route['ordersOrdered'][number]['priority']
          deliveryType: Route['ordersOrdered'][number]['deliveryType']
          weightKg: number
          deadlineAt: string
          status: Route['ordersOrdered'][number]['status']
        }>
      }>
    >((result, order) => {
      const stop = testDb.stops.find((candidate) => candidate.id === order.stopId)
      if (!stop) return result

      const existing = result.find((candidate) => candidate.stopId === stop.id)
      const mappedOrder = {
        id: order.id,
        description: order.description,
        priority: order.priority,
        deliveryType: order.deliveryType,
        weightKg: order.weightKg,
        deadlineAt: order.deadlineAt,
        status: order.status,
      }

      if (existing) {
        existing.orders.push(mappedOrder)
      } else {
        result.push({
          stopId: stop.id,
          address: stop.address,
          zoneId: stop.zoneId,
          latitude: stop.latitude ?? null,
          longitude: stop.longitude ?? null,
          visitOrder: result.length + 1,
          orders: [mappedOrder],
        })
      }
      return result
    }, [])

    const located = [
      [center.latitude ?? 0, center.longitude ?? 0] as [number, number],
      ...stops
        .filter((stop) => stop.latitude !== null && stop.longitude !== null)
        .map((stop) => [stop.latitude!, stop.longitude!] as [number, number]),
      [center.latitude ?? 0, center.longitude ?? 0] as [number, number],
    ]

    return HttpResponse.json({
      routeId: route.id,
      scheduledDate: route.scheduledDate,
      center: {
        id: center.id,
        name: center.name,
        latitude: center.latitude ?? null,
        longitude: center.longitude ?? null,
      },
      stops,
      path:
        located.length >= 2
          ? {
              latLngs: located,
              distanceMeters: 8700,
              durationSeconds: 1080,
              source: 'estimated',
            }
          : null,
    })
  }),
]
