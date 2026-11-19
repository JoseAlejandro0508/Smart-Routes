// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { MOCK_MODULES, resolveMockModules } from './config'

describe('resolveMockModules', () => {
  it('devuelve todos los módulos cuando el master está activo y no hay selección', () => {
    expect(resolveMockModules('true', undefined)).toEqual({
      enabled: true,
      modules: [...MOCK_MODULES],
      unknown: [],
    })
    expect(resolveMockModules('true', '')).toEqual({
      enabled: true,
      modules: [...MOCK_MODULES],
      unknown: [],
    })
  })

  it('filtra por los módulos solicitados', () => {
    expect(resolveMockModules('true', 'auth')).toEqual({
      enabled: true,
      modules: ['auth'],
      unknown: [],
    })
    expect(resolveMockModules('true', 'auth,orders')).toEqual({
      enabled: true,
      modules: ['auth', 'orders'],
      unknown: [],
    })
    expect(resolveMockModules('true', 'stops')).toEqual({
      enabled: true,
      modules: ['stops'],
      unknown: [],
    })
  })

  it('normaliza espacios y mayúsculas e ignora nombres desconocidos', () => {
    expect(resolveMockModules('true', ' auth , ORDERS ,nope ')).toEqual({
      enabled: true,
      modules: ['auth', 'orders'],
      unknown: ['nope'],
    })
  })

  it('se desactiva si ninguno de los nombres es válido', () => {
    expect(resolveMockModules('true', 'nope')).toEqual({
      enabled: false,
      modules: [],
      unknown: ['nope'],
    })
  })

  it('respeta el interruptor maestro', () => {
    expect(resolveMockModules('false', 'auth')).toEqual({
      enabled: false,
      modules: [],
      unknown: [],
    })
    expect(resolveMockModules(undefined, 'auth')).toEqual({
      enabled: false,
      modules: [],
      unknown: [],
    })
  })
})
