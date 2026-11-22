// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { applyApiErrors, getApiErrorMessage, getApiFieldErrors } from './http'

function axiosError(status: number, data: unknown, noResponse = false) {
  if (noResponse) {
    return { isAxiosError: true, config: {}, request: {}, message: 'Network Error' }
  }
  return {
    isAxiosError: true,
    config: {},
    request: {},
    response: { status, data, statusText: '', headers: {}, config: {} as never },
    message: String(status),
  }
}

describe('getApiErrorMessage', () => {
  it('devuelve mensaje de red cuando no hay respuesta', () => {
    expect(getApiErrorMessage(axiosError(0, null, true))).toBe(
      '📡 Sin conexión. Revisa tu red e intenta de nuevo',
    )
  })

  it('prioriza message del mock actual', () => {
    expect(getApiErrorMessage(axiosError(401, { message: 'Credenciales inválidas' }))).toBe(
      'Credenciales inválidas',
    )
  })

  it('usa detail y luego title de ProblemDetails', () => {
    expect(getApiErrorMessage(axiosError(400, { detail: 'Detalle del problema' }))).toBe(
      'Detalle del problema',
    )
    expect(getApiErrorMessage(axiosError(400, { title: 'Bad Request' }))).toBe('Bad Request')
  })

  it('prefiere message sobre detail/title', () => {
    expect(
      getApiErrorMessage(axiosError(400, { message: 'msg', detail: 'det', title: 'ttl' })),
    ).toBe('msg')
  })

  it('devuelve fallback genérico para errores no axios', () => {
    expect(getApiErrorMessage(new Error('boom'))).toBe('Error inesperado. Intenta de nuevo')
  })
})

describe('getApiFieldErrors', () => {
  it('devuelve null si no hay errores de validación', () => {
    expect(getApiFieldErrors(axiosError(400, { message: 'x' }))).toBeNull()
    expect(getApiFieldErrors(new Error('boom'))).toBeNull()
  })

  it('normaliza claves PascalCase y toma el primer mensaje', () => {
    expect(
      getApiFieldErrors(
        axiosError(400, {
          errors: {
            Email: ['Correo inválido', 'Otro'],
            CurrentPassword: ['Requerida'],
          },
        }),
      ),
    ).toEqual({ email: 'Correo inválido', currentPassword: 'Requerida' })
  })

  it('acepta mensajes como string y claves anidadas', () => {
    expect(
      getApiFieldErrors(
        axiosError(400, {
          errors: {
            'user.Name': 'Nombre requerido',
            NewPassword: 'Muy corta',
          },
        }),
      ),
    ).toEqual({ name: 'Nombre requerido', newPassword: 'Muy corta' })
  })
})

describe('applyApiErrors', () => {
  it('aplica errores de campo conocidos', () => {
    const setError = vi.fn()
    const applied = applyApiErrors(
      axiosError(400, { errors: { Email: ['Inválido'], Password: ['Corta'] } }),
      setError as never,
      { fields: ['email', 'password'] as never },
    )
    expect(applied).toBe(true)
    expect(setError).toHaveBeenCalledWith(
      'email',
      { type: 'server', message: 'Inválido' },
      { shouldFocus: true },
    )
    expect(setError).toHaveBeenCalledWith(
      'password',
      { type: 'server', message: 'Corta' },
      { shouldFocus: false },
    )
  })

  it('ignora campos fuera de la lista y cae en root.server', () => {
    const setError = vi.fn()
    const applied = applyApiErrors(
      axiosError(400, { errors: { Unknown: ['x'] } }),
      setError as never,
      { fields: ['email'] as never },
    )
    expect(applied).toBe(false)
    expect(setError).toHaveBeenCalledWith('root.server', {
      type: 'server',
      message: 'Error inesperado. Intenta de nuevo',
    })
  })

  it('respeta skipRoot cuando no aplica errores de campo', () => {
    const setError = vi.fn()
    const applied = applyApiErrors(
      axiosError(409, { message: 'Ya existe' }),
      setError as never,
      { fields: ['email'] as never, skipRoot: true },
    )
    expect(applied).toBe(false)
    expect(setError).not.toHaveBeenCalled()
  })

  it('escribe en root.server cuando no hay errores por campo', () => {
    const setError = vi.fn()
    const applied = applyApiErrors(
      axiosError(401, { message: 'Credenciales inválidas' }),
      setError as never,
    )
    expect(applied).toBe(false)
    expect(setError).toHaveBeenCalledWith('root.server', {
      type: 'server',
      message: 'Credenciales inválidas',
    })
  })
})
