import { http, HttpResponse } from 'msw'
import { testDb } from './data'
import { isAuthorized, unauthorized } from './shared'

/** Handlers de catálogos usados por las pantallas bajo prueba. */
export const catalogHandlers = [
  http.get('/api/admin/zones/get-all', ({ request }) => {
    if (!isAuthorized(request)) return unauthorized()
    return HttpResponse.json(testDb.zones)
  }),

  http.get('/api/admin/distribution-center/get-all', ({ request }) => {
    if (!isAuthorized(request)) return unauthorized()
    return HttpResponse.json(testDb.centers)
  }),

  http.get('/api/balance-criteria/get-all', ({ request }) => {
    if (!isAuthorized(request)) return unauthorized()
    return HttpResponse.json(testDb.criteria)
  }),

  http.get('/api/admin/manage-roles/delivery-persons', ({ request }) => {
    if (!isAuthorized(request)) return unauthorized()
    return HttpResponse.json(testDb.deliveryPersons)
  }),
]
