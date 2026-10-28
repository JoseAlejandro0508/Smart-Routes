// src/mocks/db.ts
// Solo vive en memoria: si recargas la página, se resetea.
// Es el equivalente a "reiniciar el servidor" del backend real.




export interface MockUser {
  id: string
  name: string
  email: string
  passwordHash: string          // nunca guardamos la contraseña en claro
  role: 'user' | 'admin'
  twoFactorEnabled: boolean
  failedAttempts: number        // para el bloqueo por intentos (login "duro")
}


// "Hash" simulado. En el backend real esto será bcrypt/argon2;
// aquí solo simulamos EL COMPORTAMIENTO (guardar algo irreversible).

export function hashPassword(plain: string): string {
  return `mock$${btoa(plain)}` // btoa = codificación base64 en el navegador
}

const ANA: MockUser = {
  id: 'usr_01',
  name: 'Ana Demo',
  email: 'ana@demo.dev',
  passwordHash: hashPassword('Password123!'),
  role: 'user',
  twoFactorEnabled: true,       // Ana usa 2FA → nos permite probar ese flujo
  failedAttempts: 0,
}

const CARLOS: MockUser = {
  id: 'usr_02',
  name: 'Carlos Demo',
  email: 'carlos@demo.dev',
  passwordHash: hashPassword('Password123!'),
  role: 'admin',
  twoFactorEnabled: false,
  failedAttempts: 0,
}

export function findUser(email: string): MockUser | undefined {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export const db = {
  users: [ANA, CARLOS] as MockUser[],
  // Tokens de refresh "válidos" emitidos por sesiones activas
  refreshTokens: new Map<string, string>(), // refreshToken → userId
  // Retos de 2FA pendientes: challengeToken → userId
  twoFactorChallenges: new Map<string, string>(),
  // Tokens de restablecimiento pendientes: token → email del dueño
  resetTokens: new Map<string, string>(),   // ← AÑADE ESTA LÍNEA
}

// ── Persistencia del mock (el "servidor" no muere con cada F5) ──
// Un backend real vive en un proceso aparte: recargar la página no lo
// reinicia. Nuestro mock vive dentro de la página, así que le damos
// memoria propia en sessionStorage para sobrevivir recargas.
const RESET_KEY = 'mock.resetTokens'

function hydrate() {
  try {
    const raw = sessionStorage.getItem(RESET_KEY)
    if (!raw) return
    for (const [token, email] of JSON.parse(raw) as Array<[string, string]>) {
      db.resetTokens.set(token, email)
    }
  } catch {
    // datos corruptos → empezar limpio
  }
}
hydrate() // al cargar el módulo, recuperamos lo que quedó de la sesión anterior

export function persistResetTokens() {
  sessionStorage.setItem(RESET_KEY, JSON.stringify([...db.resetTokens]))
}