import { http, HttpResponse } from 'msw'
import type { CreateOrderPayload, Order } from '../../api/orders.api'
import { testDb } from './data'
import { badRequest, conflict, isAuthorized, notFound, unauthorized } from './shared'

function zoneNameOf(zoneId: number) {
  return testDb.zones.find((zone) => zone.id === zoneId)?.name ?? 'Desconocida'
}

function centerNameOf(centerId: number) {
  return testDb.centers.find((center) => center.id === centerId)?.name ?? `Centro #${centerId}`
}

function positiveInteger(value: string | null, fallback: number) {
  if (value === null) return fallback
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

/** Handlers de pedidos fieles al contrato de `docs/endpoints.md`. */
export const ordersHandlers = [
  http.get('/api/orders', ({ request }) => {
    if (!isAuthorized(request)) return unauthorized()

    const url = new URL(request.url)
    const pageNumber = positiveInteger(url.searchParams.get('pageNumber'), 1)
    const pageSize = positiveInteger(url.searchParams.get('pageSize'), 20)

    if (pageNumber === null || pageSize === null || pageSize > 100) {
      return badRequest('pageNumber debe ser > 0 y pageSize debe estar entre 1 y 100.')
    }

    const zoneId = url.searchParams.get('zoneId')
    const distributionCenterId = url.searchParams.get('distributionCenterId')
    const deliveryType = url.searchParams.get('deliveryType')
    const priority = url.searchParams.get('priority')
    const status = url.searchParams.get('status')

    let items = [...testDb.orders]
    if (distributionCenterId) {
      const id = Number(distributionCenterId)
      items = items.filter((order) => order.distributionCenterId === id)
    }
    if (zoneId) {
      const id = Number(zoneId)
      items = items.filter((order) => testDb.stops.find((stop) => stop.id === order.stopId)?.zoneId === id)
    }
    if (deliveryType) items = items.filter((order) => order.deliveryType === deliveryType)
    if (priority) items = items.filter((order) => order.priority === priority)
    if (status) items = items.filter((order) => order.status === status)

    const start = (pageNumber - 1) * pageSize
    return HttpResponse.json(items.slice(start, start + pageSize), {
      headers: {
        'X-Total-Count': String(items.length),
        'X-Page-Number': String(pageNumber),
        'X-Page-Size': String(pageSize),
        'Access-Control-Expose-Headers': 'X-Total-Count, X-Page-Number, X-Page-Size',
      },
    })
  }),

  http.post('/api/orders', async ({ request }) => {
    if (!isAuthorized(request)) return unauthorized()

    const payload = (await request.json()) as CreateOrderPayload
    const description = payload.description?.trim()

    if (!description || !payload.entryDate || !payload.deadlineAt || payload.weightKg <= 0) {
      return badRequest('Descripción, peso, fecha de ingreso y fecha límite son obligatorios.')
    }
    if (!payload.stopId && !payload.stop) {
      return badRequest('Debes indicar stopId o stop.')
    }

    let stop = payload.stopId
      ? testDb.stops.find((candidate) => candidate.id === payload.stopId)
      : undefined

    if (!stop && payload.stop) {
      const zone = testDb.zones.find((candidate) => candidate.id === payload.stop?.zoneId)
      if (!zone) return notFound('La zona indicada no existe.')

      stop = {
        id: testDb.nextStopId++,
        address: payload.stop.address,
        zoneId: payload.stop.zoneId,
        zoneName: zone.name,
        latitude: null,
        longitude: null,
      }
      testDb.stops.unshift(stop)
    }

    if (!stop) return notFound('La parada indicada no existe.')

    const duplicate = testDb.orders.some(
      (order) =>
        order.distributionCenterId === payload.distributionCenterId &&
        order.stopId === stop.id &&
        order.deliveryType === payload.deliveryType &&
        order.description.trim() === description &&
        order.entryDate === payload.entryDate,
    )
    if (duplicate) {
      return conflict(
        'Ya existe un pedido con el mismo centro, parada, tipo de entrega, descripción y fecha de ingreso.',
      )
    }

    const order: Order = {
      id: testDb.nextOrderId++,
      description,
      deliveryType: payload.deliveryType,
      priority: payload.priority,
      weightKg: payload.weightKg,
      entryDate: payload.entryDate,
      deadlineAt: payload.deadlineAt,
      status: 'Pending',
      distributionCenterId: payload.distributionCenterId,
      stopId: stop.id,
      centerName: centerNameOf(payload.distributionCenterId),
      zoneName: stop.zoneName || zoneNameOf(stop.zoneId),
      address: stop.address,
    }

    testDb.orders.unshift(order)
    return HttpResponse.json(order, {
      status: 201,
      headers: { Location: `/api/Orders/${order.id}` },
    })
  }),
]
