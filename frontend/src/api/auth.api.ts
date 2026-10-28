// src/api/auth.api.ts
import { http } from './http'

// Tipos del contrato (los mismos que definimos en MSW) 

export interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
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

// "Unión discriminada": el campo literal requiresTwoFactor
// es la DISCRIMINADORA. TypeScript te obliga a verificarla antes
// de dejarte tocar accessToken o challengeToken. Adiós, undefined.
export type LoginResponse = LoginTokens | LoginRequiere2FA


export interface RegisterPayload {
  name: string
  email: string
  password: string
}

// Objeto API: una función por endpoint 

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
}