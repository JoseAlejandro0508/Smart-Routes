// src/mocks/handlers/orders.ts
// Handlers del banco de pedidos.
import { http, HttpResponse } from 'msw'
import type { CreateOrderPayload, OrderSummary } from '../../api/orders.api'
import { authenticatedUser, randomDelay } from '../shared'
import { mockState } from '../state'

/** Handlers de pedidos: listado y registro. */
export const ordersHandlers = [
  // GET /api/orders
  http.get('/api/orders', async ({ request }) => {
    await randomDelay()
    try {
      authenticatedUser(request)
      return HttpResponse.json(mockState.orders)
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
      const order: OrderSummary = {
        id: mockState.nextOrderId++, description: payload.description, deliveryType: payload.deliveryType,
        priority: payload.priority, weightKg: payload.weightKg, entryDate: payload.entryDate,
        deadlineAt: payload.deadlineAt, status: 'Pending',
        centerName: payload.distributionCenterId === 2 ? 'Centro Vedado' : 'Centro Habana',
        zoneName: payload.stop.zoneId === 2 ? 'Vedado' : payload.stop.zoneId === 3 ? 'Plaza' : 'Centro',
        address: payload.stop.address,
      }
      mockState.orders.unshift(order)
      return HttpResponse.json(order, { status: 201 })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),
]
