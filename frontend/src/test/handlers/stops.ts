import { http, HttpResponse } from 'msw'
import type { Stop, StopPayload } from '../../api/stops.api'
import { testDb } from './data'
import { badRequest, conflict, isAuthorized, notFound, unauthorized } from './shared'

function zoneNameOf(zoneId: number) {
  return testDb.zones.find((zone) => zone.id === zoneId)?.name
}

function duplicateAddress(address: string, zoneId: number, exceptId?: number) {
  return testDb.stops.some(
    (stop) =>
      stop.id !== exceptId &&
      stop.zoneId === zoneId &&
      stop.address.trim().toLowerCase() === address.trim().toLowerCase(),
  )
}

/** Handlers de paradas fieles al contrato de `docs/endpoints.md`. */
export const stopsHandlers = [
  http.get('/api/stops', ({ request }) => {
    if (!isAuthorized(request)) return unauthorized()

    const zoneId = new URL(request.url).searchParams.get('zoneId')
    if (zoneId === null) return HttpResponse.json(testDb.stops)

    const id = Number(zoneId)
    if (!Number.isInteger(id) || id <= 0) return badRequest('zoneId debe ser mayor que cero.')

    return HttpResponse.json(testDb.stops.filter((stop) => stop.zoneId === id))
  }),

  http.post('/api/stops/create-stop', async ({ request }) => {
    if (!isAuthorized(request)) return unauthorized()

    const payload = (await request.json()) as StopPayload
    const address = payload.address?.trim()
    const zoneName = zoneNameOf(payload.zoneId)

    if (!address || !zoneName) {
      return badRequest('Dirección y zona son obligatorias.', {
        Address: address ? [] : ['La dirección es obligatoria.'],
        ZoneId: zoneName ? [] : ['La zona no existe.'],
      })
    }
    if (duplicateAddress(address, payload.zoneId)) {
      return badRequest('Ya existe una parada con esa dirección en la zona.')
    }

    const stop: Stop = {
      id: testDb.nextStopId++,
      address,
      zoneId: payload.zoneId,
      zoneName,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
    }
    testDb.stops.unshift(stop)

    return new HttpResponse(null, { status: 204 })
  }),

  http.put('/api/stops/:stopId', async ({ request, params }) => {
    if (!isAuthorized(request)) return unauthorized()

    const stopId = Number(params.stopId)
    const stop = testDb.stops.find((candidate) => candidate.id === stopId)
    if (!stop) return notFound('La parada no existe.')

    const payload = (await request.json()) as StopPayload
    const address = payload.address?.trim()
    const zoneName = zoneNameOf(payload.zoneId)

    if (!address || !zoneName) {
      return badRequest('Dirección y zona son obligatorias.')
    }
    if (duplicateAddress(address, payload.zoneId, stop.id)) {
      return conflict('Ya existe otra parada con esa dirección en la zona.')
    }

    stop.address = address
    stop.zoneId = payload.zoneId
    stop.zoneName = zoneName
    stop.latitude = payload.latitude ?? stop.latitude ?? null
    stop.longitude = payload.longitude ?? stop.longitude ?? null

    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('/api/stops/:stopId', ({ request, params }) => {
    if (!isAuthorized(request)) return unauthorized()

    const stopId = Number(params.stopId)
    const index = testDb.stops.findIndex((candidate) => candidate.id === stopId)
    if (index < 0) return notFound('La parada no existe.')

    const hasOrders = testDb.orders.some((order) => order.stopId === stopId)
    const hasRoutes = testDb.routes.some((route) =>
      route.ordersOrdered.some((order) => order.stopId === stopId),
    )
    if (hasOrders || hasRoutes) {
      return conflict('La parada tiene pedidos o rutas asociadas.')
    }

    testDb.stops.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
