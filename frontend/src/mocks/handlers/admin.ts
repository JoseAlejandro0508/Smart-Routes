// src/mocks/handlers/admin.ts
// Handlers de administración de roles.
import { http, HttpResponse } from 'msw'
import type { UserRole } from '../../api/auth.api'
import { authenticatedUser, randomDelay } from '../shared'
import { mockState } from '../state'

/** Handlers de administración: consulta y asignación de roles. */
export const adminHandlers = [
  // GET /api/admin/manage-roles/users
  http.get('/api/admin/manage-roles/users', async ({ request }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'Administrator') return HttpResponse.json({ message: 'Solo un administrador puede consultar usuarios' }, { status: 403 })
      return HttpResponse.json(mockState.adminUsers)
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // PUT /api/admin/manage-roles/users/:userId/role
  http.put('/api/admin/manage-roles/users/:userId/role', async ({ request, params }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'Administrator') return HttpResponse.json({ message: 'Solo un administrador puede modificar roles' }, { status: 403 })
      const payload = (await request.json()) as { role: UserRole | '' }
      const target = mockState.adminUsers.find((candidate) => candidate.id === params.userId)
      if (!target) return HttpResponse.json({ message: 'Usuario no encontrado' }, { status: 404 })
      target.role = payload.role
      return new HttpResponse(null, { status: 204 })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // GET /api/admin/manage-roles/delivery-persons
  http.get('/api/admin/manage-roles/delivery-persons', async ({ request }) => {
    await randomDelay()
    try {
      authenticatedUser(request)
      return HttpResponse.json([
        { id: 'usr_04', email: 'marco@demo.dev', name: 'Marco Demo', dateOfBirth: '1995-04-10', fleet: 'Flota Norte' },
      ])
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),
]
