// src/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw'
import { db, findUser, hashPassword ,persistResetTokens } from './db'

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
  
]