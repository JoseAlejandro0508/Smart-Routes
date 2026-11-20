import axios, { AxiosError, type AxiosAdapter } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, tokenStore } from './http'

const originalAdapter = http.defaults.adapter

function unauthorized(config: Parameters<AxiosAdapter>[0]): AxiosError {
  return new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
    config,
    data: { title: 'Unauthorized' },
  })
}

beforeEach(() => {
  tokenStore.clear()
})

afterEach(() => {
  http.defaults.adapter = originalAdapter
  vi.restoreAllMocks()
})

describe('interceptor de renovación', () => {
  it('renueva el token ante un 401 y reintenta la petición original', async () => {
    tokenStore.set('access-viejo', 'refresh-viejo')

    const refresh = vi
      .spyOn(axios, 'post')
      .mockResolvedValue({ data: { accessToken: 'access-nuevo', refreshToken: 'refresh-nuevo' } })

    let calls = 0
    http.defaults.adapter = async (config) => {
      calls += 1
      if (calls === 1) throw unauthorized(config)
      return {
        data: { ok: true, authorization: config.headers?.Authorization },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
    }

    const response = await http.get('/recurso-protegido')

    expect(refresh).toHaveBeenCalledWith('/api/auth/refresh', { refreshToken: 'refresh-viejo' })
    expect(response.data.authorization).toBe('Bearer access-nuevo')
    expect(calls).toBe(2)
    expect(tokenStore.access).toBe('access-nuevo')
    expect(tokenStore.refresh).toBe('refresh-nuevo')
  })

  it('limpia la sesión y avisa cuando la renovación falla', async () => {
    tokenStore.set('access-viejo', 'refresh-viejo')

    vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh inválido'))
    http.defaults.adapter = async (config) => {
      throw unauthorized(config)
    }

    const expired = vi.fn()
    window.addEventListener('auth:session-expired', expired, { once: true })

    await expect(http.get('/recurso-protegido')).rejects.toMatchObject({
      response: { status: 401 },
    })

    expect(tokenStore.access).toBeNull()
    expect(tokenStore.refresh).toBeNull()
    expect(expired).toHaveBeenCalledTimes(1)
  })
})
