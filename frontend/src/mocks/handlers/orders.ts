// src/mocks/handlers/orders.ts
// Handlers del banco de pedidos.
import { http, HttpResponse } from 'msw'
import type { CreateOrderPayload, Order } from '../../api/orders.api'
import { authenticatedUser, randomDelay } from '../shared'
import { mockState } from '../state'

/** Handlers de pedidos: listado y registro. */
export const ordersHandlers = [
  // GET /api/orders
  http.get('/api/orders', async ({ request }) => {
    await randomDelay()
    try {
      authenticatedUser(request)
      const url = new URL(request.url)
      const zoneId = url.searchParams.get('zoneId')
      const deliveryType = url.searchParams.get('deliveryType')
      const priority = url.searchParams.get('priority')
      const status = url.searchParams.get('status')
      const pageNumber = Number(url.searchParams.get('pageNumber') ?? '1')
      const pageSize = Number(url.searchParams.get('pageSize') ?? '20')

      let items = [...mockState.orders]
      if (zoneId) items = items.filter((order) => order.stopId && mockState.stops.find((s) => s.id === order.stopId)?.zoneId === Number(zoneId))
      if (deliveryType) items = items.filter((order) => order.deliveryType === deliveryType)
      if (priority) items = items.filter((order) => order.priority === priority)
      if (status) items = items.filter((order) => order.status === status)

      return HttpResponse.json({
        items,
        pageNumber,
        pageSize,
        totalCount: items.length,
      })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // POST /api/orders
  http.post('/api/orders', async ({ request }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'LogisticsCoordinator') {
        return HttpResponse.json({ message: 'Solo un coordinador puede registrar pedidos' }, { status: 403 })
      }

      const payload = (await request.json()) as CreateOrderPayload
      const stop = payload.stopId
        ? mockState.stops.find((candidate) => candidate.id === payload.stopId)
        : payload.stop
          ? { id: 0, address: payload.stop.address, zoneId: payload.stop.zoneId, zoneName: payload.stop.zoneId === 2 ? 'Vedado' : payload.stop.zoneId === 3 ? 'Plaza' : 'Centro' }
          : null

      if (!stop) {
        return HttpResponse.json({ message: 'Parada no encontrada' }, { status: 404 })
      }

      const duplicate = mockState.orders.some(
        (order) =>
          order.distributionCenterId === payload.distributionCenterId &&
          order.stopId === (payload.stopId ?? 0) &&
          order.deliveryType === payload.deliveryType &&
          order.description.trim() === payload.description.trim() &&
          order.entryDate === payload.entryDate,
      )
      if (duplicate) {
        return HttpResponse.json(
          { message: 'An order with the same center, stop, delivery type, description and entry date already exists.' },
          { status: 409 },
        )
      }

      const order: Order = {
        id: mockState.nextOrderId++,
        description: payload.description,
        deliveryType: payload.deliveryType,
        priority: payload.priority,
        weightKg: payload.weightKg,
        entryDate: payload.entryDate,
        deadlineAt: payload.deadlineAt,
        status: 'Pending',
        distributionCenterId: payload.distributionCenterId,
        stopId: payload.stopId ?? stop.id,
        centerName: payload.distributionCenterId === 2 ? 'Centro Vedado' : 'Centro Habana',
        zoneName: 'zoneName' in stop ? stop.zoneName : 'Centro',
        address: stop.address,
      }
      mockState.orders.unshift(order)
      return HttpResponse.json(order.id, { status: 201 })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),
]
