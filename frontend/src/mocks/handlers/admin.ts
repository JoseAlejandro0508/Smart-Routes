// src/mocks/handlers/admin.ts
// Handlers de administración de roles.
import { http, HttpResponse } from 'msw'
import type { AdminUserRole } from '../../api/admin.api'
import { authenticatedUser, randomDelay } from '../shared'
import { mockState } from '../state'

/** Handlers de administración: consulta de roles, asignación y retirada. */
export const adminHandlers = [
  // GET /api/admin/getallusersroles
  http.get('/api/admin/getallusersroles', async ({ request }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'Administrator') return HttpResponse.json({ message: 'Solo un administrador puede consultar roles' }, { status: 403 })
      return HttpResponse.json(mockState.adminUsers)
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // PUT /api/admin/addrole
  http.put('/api/admin/addrole', async ({ request }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'Administrator') return HttpResponse.json({ message: 'Solo un administrador puede modificar roles' }, { status: 403 })
      const payload = (await request.json()) as { userId: string; role: AdminUserRole['role'] }
      const target = mockState.adminUsers.find((candidate) => candidate.id === payload.userId)
      if (!target || !payload.role) return HttpResponse.json({ message: 'Usuario o rol inválido' }, { status: 400 })
      target.role = payload.role
      return new HttpResponse(null, { status: 204 })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // DELETE /api/admin/deleterole/:userId
  http.delete('/api/admin/deleterole/:userId', async ({ request, params }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'Administrator') return HttpResponse.json({ message: 'Solo un administrador puede quitar roles' }, { status: 403 })
      const target = mockState.adminUsers.find((candidate) => candidate.id === params.userId)
      if (!target) return HttpResponse.json({ message: 'Usuario no encontrado' }, { status: 404 })
      target.role = null
      return new HttpResponse(null, { status: 204 })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),
]
