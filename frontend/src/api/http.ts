// src/api/http.ts
import axios, { AxiosError, isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

// Almacén de tokens
// Estado del módulo = patrón Singleton de facto: un solo lugar
// guarda la sesión, todo lo demás lo consulta.

const TOKEN_KEY = 'auth.accessToken'
const REFRESH_KEY = 'auth.refreshToken'

/** Almacén en `localStorage` para los tokens de acceso y refresco de la sesión. */
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

/** Instancia Axios configurada con autenticación Bearer, renovación de tokens y parseo de errores. */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
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
      !original._retried && // ...no es ya un reintento...
      !url.includes('/auth/login') && // ...no es el propio login...
      !url.includes('/auth/2fa') && // ...ni el verify de 2FA...
      !url.includes('/auth/refresh') // ...ni la renovación misma
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

/**
 * Cuerpo de error que puede devolver la API. Soporta el formato RFC 7807 /
 * ProblemDetails del backend .NET (`title`, `detail`, `errors` en
 * ValidationProblemDetails) y un `message` simple.
 */
export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  /** Errores de validación por campo (ValidationProblemDetails). */
  errors?: Record<string, string[] | string | undefined>
  /** Mensaje simple alternativo al `ProblemDetails`. */
  message?: string
}

function problemDetailsOf(error: unknown): ProblemDetails | null {
  if (!isAxiosError(error) || !error.response) return null
  const data = error.response.data
  if (typeof data === 'object' && data !== null) return data as ProblemDetails
  if (typeof data === 'string' && data.trim()) return { message: data }
  return null
}

function normalizeFieldName(name: string): string {
  if (!name) return name
  const last = name.split(/[.[\]]/).filter(Boolean).pop() ?? name
  return last.charAt(0).toLowerCase() + last.slice(1)
}

/**
 * Devuelve un mensaje legible para mostrar al usuario a partir de un error de API.
 * Prefiere `message`, luego `detail` y `title` (ProblemDetails).
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Error inesperado. Intenta de nuevo',
): string {
  if (isAxiosError(error)) {
    // Sin response = la petición NUNCA obtuvo respuesta: red caída,
    // servidor caído o el navegador en modo offline. No es un error
    // del servidor (eso tendría response.status) ni de la app.
    if (!error.response) return '📡 Sin conexión. Revisa tu red e intenta de nuevo'

    const problem = problemDetailsOf(error)
    const msg = problem?.message ?? problem?.detail ?? problem?.title
    if (msg) return msg

    if (error.response.status >= 500) return 'Error del servidor. Intenta de nuevo más tarde'
  }
  return fallback
}

/**
 * Extrae los errores de validación por campo de un `ValidationProblemDetails`.
 * Las claves se normalizan a camelCase (p. ej. `Email` → `email`) para que
 * coincidan con los nombres de los formularios. Devuelve `null` si no hay errores.
 */
export function getApiFieldErrors(error: unknown): Record<string, string> | null {
  const errors = problemDetailsOf(error)?.errors
  if (!errors || typeof errors !== 'object') return null

  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(errors)) {
    const message = Array.isArray(value) ? value.find(Boolean) : value
    if (typeof message === 'string' && message) {
      result[normalizeFieldName(key)] = message
    }
  }
  return Object.keys(result).length > 0 ? result : null
}

/** Opciones para aplicar errores de la API a un formulario de react-hook-form. */
export interface ApplyApiErrorsOptions<T extends FieldValues> {
  /** Si se indica, solo se aplican errores cuyo campo esté en esta lista. */
  fields?: Path<T>[]
  /** No escribir el mensaje general en `root.server` si no hay errores de campo. */
  skipRoot?: boolean
}

/**
 * Aplica los errores de una respuesta de API a un formulario de react-hook-form.
 * Intenta asignar errores por campo (ValidationProblemDetails) y, si no hay
 * ninguno aplicable, escribe el mensaje general en `root.server`.
 *
 * @returns `true` si se aplicó al menos un error de campo.
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  options: ApplyApiErrorsOptions<T> = {},
): boolean {
  const { fields, skipRoot } = options
  const fieldErrors = getApiFieldErrors(error)
  const allowed = fields ? new Set<string>(fields as string[]) : null

  let applied = false
  if (fieldErrors) {
    for (const [field, message] of Object.entries(fieldErrors)) {
      if (allowed && !allowed.has(field)) continue
      setError(field as Path<T>, { type: 'server', message }, { shouldFocus: !applied })
      applied = true
    }
  }

  if (!applied && !skipRoot) {
    setError('root.server' as Path<T>, { type: 'server', message: getApiErrorMessage(error) })
  }

  return applied
}