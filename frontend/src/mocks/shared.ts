import { delay } from 'msw'
import { db } from './db'

export function randomDelay() {
    // Deliberadamente corto: las pruebas no deben esperar ~1 s por petición.
    return delay(40 + Math.random() * 80)
}

export function fakeJwt(userId: string) {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({
        sub: userId,
        exp: Math.floor(Date.now() / 1000) + 60 * 15,//15 minutos
    }))

    return `${header}.${payload}.firma-simulada`
}

export function tokensFor(userId: string) {
    const accessToken = fakeJwt(userId)
    const refreshToken = `rt_${crypto.randomUUID()}`
    db.refreshTokens.set(refreshToken, userId)
    return { accessToken, refreshToken }
}

export const MAX_ATTEMPTS = 5

export function authenticatedUser(request: Request) {
  const token = (request.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const payload = JSON.parse(atob(token.split('.')[1])) as { sub?: string }
  const user = db.users.find((candidate) => candidate.id === payload.sub)
  if (!user) throw new Error('no user')
  return user
}