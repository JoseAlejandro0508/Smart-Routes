// src/api/auth.api.ts
import { http } from './http'

// Tipos del contrato del backend (ver docs/endpoints.md).

/** Roles del dominio soportados por el backend. */
export type UserRole =
  | 'Administrator'
  | 'LogisticsCoordinator'
  | 'OperationsSupervisor'
  | 'DeliveryPerson'

/** Usuario autenticado devuelto por la API de sesión. */
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

/**
 * Comprueba en runtime que un valor tenga la forma esperada de `User`.
 * Evita tratar respuestas inválidas (p. ej. HTML del dev server) como sesión válida.
 */
export function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<User>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.role === 'string'
  )
}

interface LoginTokens {
  requiresTwoFactor?: false
  accessToken: string
  refreshToken: string
}

interface LoginRequiere2FA {
  requiresTwoFactor: true
  challengeToken: string
}

/** Respuesta del inicio de sesión: tokens directos o desafío de segundo factor. */
export type LoginResponse = LoginTokens | LoginRequiere2FA

/** Datos requeridos para registrar una nueva cuenta. */
export interface RegisterPayload {
  name: string
  email: string
  password: string
}

/** Cliente de API para autenticación y gestión de sesión. */
export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await http.post('/auth/login', { email, password })
    return data
  },
  async changePassword(payload: { currentPassword: string; newPassword: string }) {
    const { data } = await http.post('/auth/change-password', payload)
    return data
  },

  async verify2FA(challengeToken: string, code: string): Promise<LoginTokens> {
    const { data } = await http.post('/auth/2fa/verify', { challengeToken, code })
    return data
  },
  
  async resend2FA(challengeToken: string) {
    const { data } = await http.post('/auth/2fa/resend', { challengeToken })
    return data
  },

  async register(payload: RegisterPayload) {
    const { data } = await http.post('/auth/register', payload)
    return data
  },

  async forgot(email: string) {
    const { data } = await http.post('/auth/forgot', { email })
    return data
  },

  async reset(payload: { token: string; newPassword: string }) {
    const { data } = await http.post('/auth/reset', payload)
    return data
  },
  async me(): Promise<User> {
    const { data } = await http.get('/auth/me')
    return data
  },
  async logout(refreshToken?: string | null) {
    const { data } = await http.post('/auth/logout', { refreshToken })
    return data
  },
}