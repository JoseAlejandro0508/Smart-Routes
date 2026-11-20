// src/mocks/handlers/stops.ts
// Handlers de paradas de entrega.
import { http, HttpResponse } from 'msw'
import type { Stop, StopPayload } from '../../api/stops.api'
import { authenticatedUser, randomDelay } from '../shared'
import { mockState } from '../state'

const ZONE_NAMES: Record<number, string> = { 1: 'Centro', 2: 'Vedado', 3: 'Plaza' }

function canManageStops(role: string) {
  return role === 'LogisticsCoordinator' || role === 'Administrator'
}

/** Handlers de paradas: listado, alta y edición. */
export const stopsHandlers = [
  // GET /api/stops?zoneId=
  http.get('/api/stops', async ({ request }) => {
    await randomDelay()
    try {
      authenticatedUser(request)
      const zoneId = new URL(request.url).searchParams.get('zoneId')
      const stops = zoneId
        ? mockState.stops.filter((stop) => stop.zoneId === Number(zoneId))
        : mockState.stops
      return HttpResponse.json(stops)
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // POST /api/stops/create-stop
  http.post('/api/stops/create-stop', async ({ request }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (!canManageStops(user.role)) {
        return HttpResponse.json({ message: 'No tienes permisos para registrar paradas' }, { status: 403 })
      }
      const payload = (await request.json()) as StopPayload
      if (!payload.address?.trim() || !ZONE_NAMES[payload.zoneId]) {
        return HttpResponse.json({ message: 'Dirección y zona son obligatorias' }, { status: 400 })
      }
      const stop: Stop = {
        id: mockState.nextStopId++,
        address: payload.address.trim(),
        zoneId: payload.zoneId,
        zoneName: ZONE_NAMES[payload.zoneId],
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
      }
      mockState.stops.unshift(stop)
      return HttpResponse.json(stop, { status: 201 })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // PUT /api/stops/:id
  http.put('/api/stops/:id', async ({ request, params }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (!canManageStops(user.role)) {
        return HttpResponse.json({ message: 'No tienes permisos para editar paradas' }, { status: 403 })
      }
      const payload = (await request.json()) as StopPayload
      const id = Number(params.id)
      const stop = mockState.stops.find((candidate) => candidate.id === id)
      if (!stop) return HttpResponse.json({ message: 'Parada no encontrada' }, { status: 404 })
      if (!payload.address?.trim() || !ZONE_NAMES[payload.zoneId]) {
        return HttpResponse.json({ message: 'Dirección y zona son obligatorias' }, { status: 400 })
      }
      stop.address = payload.address.trim()
      stop.zoneId = payload.zoneId
      stop.zoneName = ZONE_NAMES[payload.zoneId]
      return HttpResponse.json(stop)
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),
]
