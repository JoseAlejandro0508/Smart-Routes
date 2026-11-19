// src/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw'
import { db, findUser, hashPassword ,persistResetTokens } from './db'
import type { CreateOrderPayload, OrderSummary } from '../api/orders.api'
import type { GenerateRoutePayload, RouteSummary, ReviewRoutePayload } from '../api/routes.api'
import type { AssignedRoute, RecordDeliveryPayload } from '../api/deliveries.api'
import type { CreateReschedulingPayload, ManualResolution, ReschedulingRequest } from '../api/reschedulings.api'
import type { AdminUserRole } from '../api/admin.api'
import type { ReportData, ReportId } from '../api/reports.api'

// Utilidades

// Latencia de red simulada (300–900ms).
// Un login "fluido" debe verse bien TAMBIÉN cuando la red es lenta.
function randomDelay() {
  return delay(300 + Math.random() * 600)
}

// JWT simulado (formato header.payload.firma, sin firma real).
// El backend real firmará con su secreto; al frontend da igual:
// solo lo recibe, guarda y manda de vuelta.
function fakeJwt(userId: string) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 minutos
  }))
  return `${header}.${payload}.firma-simulada`
}

// Par de tokens para una sesión + registro del refresh en la db
function tokensFor(userId: string) {
  const accessToken = fakeJwt(userId)
  const refreshToken = `rt_${crypto.randomUUID()}`
  db.refreshTokens.set(refreshToken, userId)
  return { accessToken, refreshToken }
}

const MAX_ATTEMPTS = 5

let nextOrderId = 1004
const mockOrders: OrderSummary[] = [
  { id: 1001, description: 'Paquete de repuestos', deliveryType: 'Parcel', priority: 'Urgent', weightKg: 4.5, entryDate: '2026-11-01', deadlineAt: '2026-11-01T14:00:00Z', status: 'Pending', centerName: 'Centro Habana', zoneName: 'Centro', address: 'Calle 23 #456' },
  { id: 1002, description: 'Documentos de contrato', deliveryType: 'Documents', priority: 'Medium', weightKg: 0.3, entryDate: '2026-11-01', deadlineAt: '2026-11-01T16:30:00Z', status: 'InRoute', centerName: 'Centro Habana', zoneName: 'Vedado', address: 'Avenida 5ta #120' },
  { id: 1003, description: 'Productos refrigerados', deliveryType: 'Perishable', priority: 'Urgent', weightKg: 8.2, entryDate: '2026-11-01', deadlineAt: '2026-11-01T12:00:00Z', status: 'Pending', centerName: 'Centro Habana', zoneName: 'Plaza', address: 'Calle 12 #78' },
]

let nextRouteId = 204
const mockRoutes: RouteSummary[] = [
  {
    id: 201, creationDate: '2026-10-31T16:20:00Z', scheduledDate: '2026-11-01', vehicleCapacityKg: 80,
    generatorName: 'Ana Demo', centerName: 'Centro Habana', status: 'PendingApproval', orderCount: 18, stopCount: 12,
    parameters: [{ label: 'Proporción de tipo', value: '40% paquetería / 30% documentos / 30% perecederos' }, { label: 'Cobertura de zonas', value: '4 zonas' }, { label: 'Peso total', value: '62.4 kg' }],
  },
  {
    id: 202, creationDate: '2026-10-30T15:05:00Z', scheduledDate: '2026-10-31', vehicleCapacityKg: 100,
    generatorName: 'Ana Demo', centerName: 'Centro Habana', status: 'Approved', orderCount: 24, stopCount: 15, deliveryPersonName: 'Marco Demo',
    parameters: [{ label: 'Proporción de tipo', value: '50% paquetería / 25% documentos / 25% perecederos' }, { label: 'Cobertura de zonas', value: '5 zonas' }, { label: 'Peso total', value: '78.1 kg' }],
  },
  {
    id: 203, creationDate: '2026-10-29T13:40:00Z', scheduledDate: '2026-10-30', vehicleCapacityKg: 60,
    generatorName: 'Ana Demo', centerName: 'Centro Vedado', status: 'Rejected', orderCount: 12, stopCount: 9,
    parameters: [{ label: 'Proporción de tipo', value: '60% paquetería / 20% documentos / 20% perecederos' }, { label: 'Cobertura de zonas', value: '3 zonas' }, { label: 'Peso total', value: '59.7 kg' }],
  },
]

const assignedRoutes: AssignedRoute[] = [
  {
    routeId: 202,
    scheduledDate: '2026-10-31',
    centerName: 'Centro Habana',
    stops: [
      { orderId: 1001, description: 'Paquete de repuestos', address: 'Calle 23 #456', zoneName: 'Centro', priority: 'Urgent', result: 'Pending' },
      { orderId: 1002, description: 'Documentos de contrato', address: 'Avenida 5ta #120', zoneName: 'Vedado', priority: 'Medium', result: 'Successful', observations: 'Recibido en recepción' },
      { orderId: 1003, description: 'Productos refrigerados', address: 'Calle 12 #78', zoneName: 'Plaza', priority: 'Urgent', result: 'Pending' },
    ],
  },
]

let nextReschedulingId = 1
const mockReschedulings: ReschedulingRequest[] = []

const mockAdminUsers: AdminUserRole[] = [
  { id: 'usr_01', name: 'Ana Demo', email: 'ana@demo.dev', role: 'LogisticsCoordinator' },
  { id: 'usr_02', name: 'Carlos Demo', email: 'carlos@demo.dev', role: 'Administrator' },
  { id: 'usr_03', name: 'Sofía Demo', email: 'sofia@demo.dev', role: 'OperationsSupervisor' },
  { id: 'usr_04', name: 'Marco Demo', email: 'marco@demo.dev', role: 'DeliveryPerson' },
]

const mockReports: Record<ReportId, ReportData> = {
  'generated-routes': { id: 'generated-routes', title: 'Rutas generadas por centro', description: 'Rutas automáticas, creador, fecha y parámetros usados.', columns: ['Centro', 'Ruta', 'Creador', 'Fecha', 'Parámetros'], rows: [{ Centro: 'Centro Habana', Ruta: '#201', Creador: 'Ana Demo', Fecha: '01/11/2026', Parámetros: 'Zonas + tipo + peso' }, { Centro: 'Centro Habana', Ruta: '#202', Creador: 'Ana Demo', Fecha: '31/10/2026', Parámetros: 'Tipo + capacidad' }, { Centro: 'Centro Vedado', Ruta: '#203', Creador: 'Ana Demo', Fecha: '30/10/2026', Parámetros: 'Zonas + pedidos' }] },
  'managed-orders': { id: 'managed-orders', title: 'Pedidos más gestionados', description: 'Pedidos finales clasificados por prioridad y zona.', columns: ['Pedido', 'Zona', 'Prioridad', 'Veces gestionado'], rows: [{ Pedido: '#1001', Zona: 'Centro', Prioridad: 'Urgente', 'Veces gestionado': 8 }, { Pedido: '#1003', Zona: 'Plaza', Prioridad: 'Urgente', 'Veces gestionado': 6 }, { Pedido: '#1002', Zona: 'Vedado', Prioridad: 'Media', 'Veces gestionado': 4 }] },
  'validated-routes': { id: 'validated-routes', title: 'Rutas validadas por revisor', description: 'Decisiones, fechas y observaciones de supervisión.', columns: ['Revisor', 'Ruta', 'Decisión', 'Fecha', 'Observaciones'], rows: [{ Revisor: 'Sofía Demo', Ruta: '#202', Decisión: 'Aprobada', Fecha: '31/10/2026', Observaciones: 'Criterios cumplidos' }, { Revisor: 'Sofía Demo', Ruta: '#203', Decisión: 'Rechazada', Fecha: '30/10/2026', Observaciones: 'Revisar cobertura' }] },
  'delivery-performance': { id: 'delivery-performance', title: 'Desempeño de repartidores', description: 'Tasas de entrega a tiempo clasificadas por prioridad.', columns: ['Repartidor', 'Ruta', 'Urgentes a tiempo', 'Medias a tiempo', 'Total'], rows: [{ Repartidor: 'Marco Demo', Ruta: '#202', 'Urgentes a tiempo': '92%', 'Medias a tiempo': '100%', Total: '95%' }, { Repartidor: 'Luis Demo', Ruta: '#204', 'Urgentes a tiempo': '84%', 'Medias a tiempo': '90%', Total: '87%' }] },
  'center-comparison': { id: 'center-comparison', title: 'Comparación entre centros', description: 'Distribución de pedidos y cumplimiento de criterios.', columns: ['Centro', 'Pedidos', 'Zonas', 'Prioridad urgente', 'Criterios cumplidos'], rows: [{ Centro: 'Centro Habana', Pedidos: 128, Zonas: 6, 'Prioridad urgente': '31%', 'Criterios cumplidos': 'Sí' }, { Centro: 'Centro Vedado', Pedidos: 94, Zonas: 4, 'Prioridad urgente': '27%', 'Criterios cumplidos': 'Sí' }] },
  'priority-correlation': { id: 'priority-correlation', title: 'Prioridad y rendimiento', description: 'Correlación entre prioridad, incumplimientos y rendimiento por centro.', columns: ['Centro', 'Correlación', 'Incumplimiento', 'Coordinador', 'Flota comparada'], rows: [{ Centro: 'Centro Habana', Correlación: '0.72', Incumplimiento: '12%', Coordinador: 'Ana Demo', 'Flota comparada': 'Flota Norte' }, { Centro: 'Centro Vedado', Correlación: '0.64', Incumplimiento: '16%', Coordinador: 'Ana Demo', 'Flota comparada': 'Flota Centro' }] },
}

function authenticatedUser(request: Request) {
  const token = (request.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const payload = JSON.parse(atob(token.split('.')[1])) as { sub?: string }
  const user = db.users.find((candidate) => candidate.id === payload.sub)
  if (!user) throw new Error('no user')
  return user
}

// Handlers

export const handlers = [
  // POST /api/auth/register
  http.post('/api/auth/register', async ({ request }) => {
    await randomDelay()
    const body = (await request.json()) as {
      name: string
      email: string
      password: string
    }

    if (findUser(body.email)) {
      // 409 Conflict: el email ya está tomado (no 401, no 400)
      return HttpResponse.json(
        { message: 'Este correo ya está registrado' },
        { status: 409 },
      )
    }

    const user = {
      id: `usr_${crypto.randomUUID()}`,
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash: hashPassword(body.password),
      // Rol por defecto del registro: quien se crea una cuenta trabaja
      // como coordinador (crea pedidos y rutas). Los demás roles los
      // asigna un Administrador (endpoint /admin/users de su contrato).
      role: 'LogisticsCoordinator' as const,
      twoFactorEnabled: false,
      failedAttempts: 0,
    }
    db.users.push(user)

    return HttpResponse.json(
      { user: { id: user.id, name: user.name, email: user.email } },
      { status: 201 }, // 201 Created: semántica HTTP correcta
    )
  }),

  // POST /api/auth/login
  http.post('/api/auth/login', async ({ request }) => {
    await randomDelay()
    const { email, password } = (await request.json()) as {
      email: string
      password: string
    }
    const user = findUser(email)

    // 🔐 Mensaje IGUAL para email inexistente y contraseña incorrecta:
    // distinguirlos permitiría sondear qué correos existen (enumeración)
    if (!user || user.passwordHash !== hashPassword(password)) {
      if (user) user.failedAttempts++
      if (user && user.failedAttempts >= MAX_ATTEMPTS) {
        return HttpResponse.json(
          { message: 'Demasiados intentos. Cuenta bloqueada temporalmente' },
          { status: 429 },
        )
      }
      return HttpResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 },
      )
    }

    user.failedAttempts = 0 // login exitoso → reseteamos el contador

    // Con 2FA NO se entregan tokens todavía: primero el segundo factor
    if (user.twoFactorEnabled) {
      const challengeToken = `2fa_${crypto.randomUUID()}`
      db.twoFactorChallenges.set(challengeToken, user.id)
      // En producción el código llega por SMS/email/authenticator;
      // el mock lo imprime en consola para poder probar
      console.log(`[MOCK] Código 2FA para ${user.email}: 123456`)
      return HttpResponse.json({
        requiresTwoFactor: true,
        challengeToken,
      })
    }

    return HttpResponse.json(tokensFor(user.id))
  }),

  // POST /api/auth/2fa/verify 
  http.post('/api/auth/2fa/verify', async ({ request }) => {
    await randomDelay()
    const { challengeToken, code } = (await request.json()) as {
      challengeToken: string
      code: string
    }
    const userId = db.twoFactorChallenges.get(challengeToken)

    if (!userId || code !== '123456') {
      return HttpResponse.json(
        { message: 'Código incorrecto o expirado' },
        { status: 401 },
      )
    }

    // Un reto se usa UNA sola vez
    db.twoFactorChallenges.delete(challengeToken)
    return HttpResponse.json(tokensFor(userId))
  }),
  // POST /api/auth/2fa/resend 
  http.post('/api/auth/2fa/resend', async ({ request }) => {
    await randomDelay()
    const { challengeToken } = (await request.json()) as { challengeToken: string }
    const userId = db.twoFactorChallenges.get(challengeToken)
    if (!userId) {
      return HttpResponse.json(
        { message: 'Reto inválido o expirado. Inicia sesión de nuevo' },
        { status: 401 },
      )
    }
    const user = db.users.find((u) => u.id === userId)
    console.log(`📱 [MOCK] Código 2FA reenviado para ${user?.email}: 123456`)
    return HttpResponse.json({ message: 'Código reenviado' })
  }),

  // POST /api/auth/refresh
  http.post('/api/auth/refresh', async ({ request }) => {
    await randomDelay()
    // En producción el refreshToken viaja en cookie httpOnly que el
    // navegador adjunta solo. El mock lo acepta también en el body
    // para facilitar pruebas desde consola.
    const body = (await request.json().catch(() => ({}))) as {
      refreshToken?: string
    }
    const cookie = request.headers.get('Cookie') ?? ''
    const token =
      body.refreshToken ??
      /refreshToken=([^;]+)/.exec(cookie)?.[1]

    const userId = token ? db.refreshTokens.get(token) : undefined
    if (!userId) {
      return HttpResponse.json(
        { message: 'Sesión expirada' },
        { status: 401 },
      )
    }

    // Rotación: el token viejo muere, nace uno nuevo
    db.refreshTokens.delete(token!)
    return HttpResponse.json(tokensFor(userId))
  }),

  // POST /api/auth/forgot
  http.post('/api/auth/forgot', async ({ request }) => {
    await randomDelay()
    const { email } = (await request.json()) as { email: string }
    const user = findUser(email)
    if (user) {
      const token = `reset_${crypto.randomUUID()}`
      // En el backend real: expiración de 5–15 min y un solo uso.
      // La "bandeja de entrada" de la demo es la consola:
      console.log(`[MOCK] Enlace de reset: /reset-password?token=${token}`)
      db.resetTokens.set(token, user.email)
      persistResetTokens()   // ← añade
    }
    // SIEMPRE 200 con mensaje genérico (anti user-enumeration)
    return HttpResponse.json({
      message: 'Si el correo existe, te enviamos un enlace',
    })
  }),

  // POST /api/auth/reset 
  http.post('/api/auth/reset', async ({ request }) => {
    await randomDelay()
    const { token, newPassword } = (await request.json()) as {
      token: string
      newPassword: string
    }
    // El token identifica al usuario: el email viaja DENTRO de él
    const email = token ? db.resetTokens.get(token) : undefined
    const user = email ? findUser(email) : undefined
    if (!user) {
      return HttpResponse.json(
        { message: 'Enlace inválido o expirado' },
        { status: 400 },
      )
    }
    user.passwordHash = hashPassword(newPassword)
    user.failedAttempts = 0
    db.resetTokens.delete(token!) // un solo uso: quemar el token
    db.refreshTokens.clear()      // matar TODAS las sesiones activas
    persistResetTokens()   
    return HttpResponse.json({ message: 'Contraseña actualizada' })
  }),


// POST /api/auth/change-password 
  http.post('/api/auth/change-password', async ({ request }) => {
    await randomDelay()
    // La identidad viene del TOKEN (que el interceptor adjunta),
    // nunca del body: el body lo escribe el cliente, el header lo firma
    const auth = request.headers.get('Authorization') ?? ''
    const token = auth.replace('Bearer ', '')
    let userId: string | undefined
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      userId = payload.sub
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
    const user = db.users.find((u) => u.id === userId)
    if (!user) {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const { currentPassword, newPassword } = (await request.json()) as {
      currentPassword: string
      newPassword: string
    }
    if (user.passwordHash !== hashPassword(currentPassword)) {
      // Error de CAMPO: la actual no coincide (400, no 401 — la sesión es válida)
      return HttpResponse.json(
        { message: 'La contraseña actual no es correcta' },
        { status: 400 },
      )
    }
    user.passwordHash = hashPassword(newPassword)
    db.refreshTokens.clear() // matar TODAS las sesiones (buena práctica)
    return HttpResponse.json({ message: 'Contraseña actualizada' })
  }),

  // GET /api/auth/me 
  http.get('/api/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization') ?? ''
    const token = auth.replace('Bearer ', '')
    // Decodificamos el payload del JWT simulado (sin validar firma;
    // eso lo hará el backend real)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const user = db.users.find((u) => u.id === payload.sub)
      if (!user) throw new Error('no user')
      return HttpResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // GET /api/dashboard/summary
  http.get('/api/dashboard/summary', async ({ request }) => {
    await randomDelay()
    const auth = request.headers.get('Authorization') ?? ''
    const token = auth.replace('Bearer ', '')

    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { sub?: string }
      const user = db.users.find((candidate) => candidate.id === payload.sub)
      if (!user) throw new Error('no user')

      const summaries = {
        Administrator: { totalOrders: 248, activeRoutes: 18, pendingDeliveries: 42, completedDeliveries: 186 },
        LogisticsCoordinator: { totalOrders: 86, activeRoutes: 7, pendingDeliveries: 15, completedDeliveries: 64 },
        OperationsSupervisor: { totalOrders: 124, activeRoutes: 11, pendingDeliveries: 22, completedDeliveries: 96 },
        DeliveryPerson: { totalOrders: 18, activeRoutes: 2, pendingDeliveries: 5, completedDeliveries: 11 },
      }[user.role]

      return HttpResponse.json({ ...summaries, generatedAt: new Date().toISOString() })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // GET /api/orders
  http.get('/api/orders', async ({ request }) => {
    await randomDelay()
    try {
      authenticatedUser(request)
      return HttpResponse.json(mockOrders)
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
        id: nextOrderId++, description: payload.description, deliveryType: payload.deliveryType,
        priority: payload.priority, weightKg: payload.weightKg, entryDate: payload.entryDate,
        deadlineAt: payload.deadlineAt, status: 'Pending',
        centerName: payload.distributionCenterId === 2 ? 'Centro Vedado' : 'Centro Habana',
        zoneName: payload.stop.zoneId === 2 ? 'Vedado' : payload.stop.zoneId === 3 ? 'Plaza' : 'Centro',
        address: payload.stop.address,
      }
      mockOrders.unshift(order)
      return HttpResponse.json(order, { status: 201 })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // GET /api/routes
  http.get('/api/routes', async ({ request }) => {
    await randomDelay()
    try {
      authenticatedUser(request)
      return HttpResponse.json(mockRoutes)
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
      const route: RouteSummary = {
        id: nextRouteId++, creationDate: new Date().toISOString(), scheduledDate: payload.scheduledDate,
        vehicleCapacityKg: payload.vehicleCapacityKg, generatorName: user.name,
        centerName: payload.distributionCenterId === 2 ? 'Centro Vedado' : 'Centro Habana',
        status: 'PendingApproval', orderCount: payload.orderIds.length, stopCount: Math.max(1, payload.orderIds.length - 1),
        parameters: [{ label: 'Pedidos seleccionados', value: `${payload.orderIds.length}` }, { label: 'Capacidad', value: `${payload.vehicleCapacityKg} kg` }, { label: 'Cobertura', value: 'Pendiente de cálculo' }],
      }
      mockRoutes.unshift(route)
      return HttpResponse.json(route, { status: 201 })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // POST /api/routes/:id/review
  http.post('/api/routes/:id/review', async ({ request, params }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'OperationsSupervisor') {
        return HttpResponse.json({ message: 'Solo un supervisor puede validar rutas' }, { status: 403 })
      }
      const route = mockRoutes.find((candidate) => candidate.id === Number(params.id))
      if (!route) return HttpResponse.json({ message: 'Ruta no encontrada' }, { status: 404 })

      const payload = (await request.json()) as ReviewRoutePayload
      if (payload.decision === 'Rejected' && !payload.observations?.trim()) {
        return HttpResponse.json({ message: 'La observación es obligatoria al rechazar' }, { status: 400 })
      }
      route.status = payload.decision === 'Approved' ? 'Approved' : 'Rejected'
      return HttpResponse.json(route)
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // GET /api/delivery/routes
  http.get('/api/delivery/routes', async ({ request }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'DeliveryPerson') return HttpResponse.json({ message: 'Solo un repartidor puede consultar sus rutas' }, { status: 403 })
      return HttpResponse.json(assignedRoutes)
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // POST /api/delivery/routes/:routeId/stops/:orderId
  http.post('/api/delivery/routes/:routeId/stops/:orderId', async ({ request, params }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'DeliveryPerson') return HttpResponse.json({ message: 'Solo un repartidor puede registrar entregas' }, { status: 403 })
      const route = assignedRoutes.find((candidate) => candidate.routeId === Number(params.routeId))
      const stop = route?.stops.find((candidate) => candidate.orderId === Number(params.orderId))
      if (!stop) return HttpResponse.json({ message: 'Parada no encontrada' }, { status: 404 })
      if (stop.result !== 'Pending') return HttpResponse.json({ message: 'Esta entrega ya fue registrada' }, { status: 409 })
      const payload = (await request.json()) as RecordDeliveryPayload
      if (payload.result === 'Failed' && !payload.observations?.trim()) return HttpResponse.json({ message: 'Indica el motivo de la entrega fallida' }, { status: 400 })
      stop.result = payload.result
      stop.observations = payload.observations
      return HttpResponse.json(stop)
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // GET /api/reschedulings
  http.get('/api/reschedulings', async ({ request }) => {
    await randomDelay()
    try {
      authenticatedUser(request)
      return HttpResponse.json(mockReschedulings)
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // POST /api/reschedulings
  http.post('/api/reschedulings', async ({ request }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'DeliveryPerson') return HttpResponse.json({ message: 'Solo un repartidor puede solicitar una reprogramación' }, { status: 403 })
      const payload = (await request.json()) as CreateReschedulingPayload
      if (!payload.reason.trim() || !payload.resolverCoordinatorId) return HttpResponse.json({ message: 'Motivo y coordinador son obligatorios' }, { status: 400 })
      const requestItem: ReschedulingRequest = {
        id: nextReschedulingId++, routeId: payload.routeId, orderId: payload.orderId,
        orderDescription: assignedRoutes.flatMap((route) => route.stops).find((stop) => stop.orderId === payload.orderId)?.description ?? `Pedido #${payload.orderId}`,
        reason: payload.reason, requestDate: new Date().toISOString(), status: 'Pending',
        resolverCoordinatorId: payload.resolverCoordinatorId, resolverCoordinatorName: 'Ana Demo',
      }
      mockReschedulings.unshift(requestItem)
      return HttpResponse.json(requestItem, { status: 201 })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // POST /api/reschedulings/:id/resolve
  http.post('/api/reschedulings/:id/resolve', async ({ request, params }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'LogisticsCoordinator') return HttpResponse.json({ message: 'Solo un coordinador puede resolver la solicitud' }, { status: 403 })
      const requestItem = mockReschedulings.find((item) => item.id === Number(params.id))
      if (!requestItem) return HttpResponse.json({ message: 'Solicitud no encontrada' }, { status: 404 })
      const { manualResult } = (await request.json()) as { manualResult: ManualResolution }
      requestItem.status = 'Resolved'
      requestItem.manualResult = manualResult
      return HttpResponse.json(requestItem)
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // GET /api/admin/getallusersroles
  http.get('/api/admin/getallusersroles', async ({ request }) => {
    await randomDelay()
    try {
      const user = authenticatedUser(request)
      if (user.role !== 'Administrator') return HttpResponse.json({ message: 'Solo un administrador puede consultar roles' }, { status: 403 })
      return HttpResponse.json(mockAdminUsers)
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
      const target = mockAdminUsers.find((candidate) => candidate.id === payload.userId)
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
      const target = mockAdminUsers.find((candidate) => candidate.id === params.userId)
      if (!target) return HttpResponse.json({ message: 'Usuario no encontrado' }, { status: 404 })
      target.role = null
      return new HttpResponse(null, { status: 204 })
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),

  // GET /api/reports/:reportId
  http.get('/api/reports/:reportId', async ({ request, params }) => {
    await randomDelay()
    try {
      authenticatedUser(request)
      const report = mockReports[params.reportId as ReportId]
      if (!report) return HttpResponse.json({ message: 'Reporte no encontrado' }, { status: 404 })
      return HttpResponse.json(report)
    } catch {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
  }),
  
]