// src/api/http.ts
import axios, { AxiosError, type InternalAxiosRequestConfig,isAxiosError } from 'axios'

// Almacén de tokens 
// Estado del módulo = patrón Singleton de facto: un solo lugar
// guarda la sesión, todo lo demás lo consulta.

const TOKEN_KEY = 'auth.accessToken'
const REFRESH_KEY = 'auth.refreshToken'

export const tokenStore = {
  get access() {
    return localStorage.getItem(TOKEN_KEY)
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY)
  },
  set(access: string, refresh: string) {
    localStorage.setItem(TOKEN_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

// Instancia configurada 

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})

// INTERCEPTOR DE REQUEST: adjunta el token a cada petición saliente
http.interceptors.request.use((config) => {
  const token = tokenStore.access
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Renovación con "cola" 
// Si 5 peticiones fallan con 401 a la vez (típico al cargar un
// dashboard), solo debe ejecutarse UNA renovación. Las 5 esperan
// la misma promesa. El secreto: guardar la promesa, no el resultado.

let refreshPromise: Promise<string> | null = null

function refreshTokens(): Promise<string> {
  refreshPromise ??= (async () => {
    const refreshToken = tokenStore.refresh
    if (!refreshToken) throw new Error('No hay refresh token')

    // Usamos axios "pelado" (axios global), NO nuestra instancia http.
    // Si usáramos http y la renovación diera 401, el interceptor
    // intentaría renovar de nuevo → bucle infinito. Regla de oro:
    // la llamada de renovación sale por fuera de su propio interceptor.
    const { data } = await axios.post('/api/auth/refresh', { refreshToken })
    tokenStore.set(data.accessToken, data.refreshToken)
    return data.accessToken as string
  })()
  return refreshPromise
}

// INTERCEPTOR DE RESPONSE: ante un 401, renueva y reintenta
http.interceptors.response.use(
  (response) => response, // todo bien → sigue su curso
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean // bandera propia: solo reintentamos UNA vez
    }
    const url = original.url ?? ''

    // ¿Corresponde renovar? Solo si:
    const puedeRenovar =
      error.response?.status === 401 && // fue "no autorizado"...
      !original._retried &&             // ...no es ya un reintento...
      !url.includes('/auth/login') &&   // ...no es el propio login...
      !url.includes('/auth/2fa') &&     // ...ni el verify de 2FA...
      !url.includes('/auth/refresh')    // ...ni la renovación misma
    // (login y 2FA dan 401 por credenciales MALAS: ahí no hay
    //  token que renovar, el usuario debe reintentar a mano)

    if (puedeRenovar) {
      original._retried = true
      try {
        const nuevoToken = await refreshTokens() // todos comparten ESTA promesa
        original.headers.Authorization = `Bearer ${nuevoToken}`
        return http(original) // 🔁 reenvía la petición original ya autenticada
      } catch {
        tokenStore.clear()
        window.dispatchEvent(new CustomEvent('auth:session-expired'))
      } finally {
        refreshPromise = null // libera la cola para el próximo ciclo
      }
    }

    return Promise.reject(error) // propaga el error a quien llamó
  },
)

export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    // Sin response = la petición NUNCA obtuvo respuesta: red caída,
    // servidor caído o el navegador en modo offline. No es un error
    // del servidor (eso tendría response.status) ni de la app.
    if (!error.response) return '📡 Sin conexión. Revisa tu red e intenta de nuevo'
    const msg = (error.response?.data as { message?: string } | undefined)?.message
    if (msg) return msg // p. ej. "Credenciales inválidas" (el nuestro, el bueno)
  }
  return 'Error inesperado. Intenta de nuevo'
}