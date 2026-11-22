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
    expect(resolveMockModules('true', 'orders')).toEqual({
      enabled: true,
      modules: ['orders'],
      unknown: [],
    })
    expect(resolveMockModules('true', 'dashboard,orders')).toEqual({
      enabled: true,
      modules: ['dashboard', 'orders'],
      unknown: [],
    })
    expect(resolveMockModules('true', 'stops')).toEqual({
      enabled: true,
      modules: ['stops'],
      unknown: [],
    })
  })

  it('normaliza espacios y mayúsculas e ignora nombres desconocidos', () => {
    expect(resolveMockModules('true', ' dashboard , ORDERS ,nope ')).toEqual({
      enabled: true,
      modules: ['dashboard', 'orders'],
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
    expect(resolveMockModules('false', 'orders')).toEqual({
      enabled: false,
      modules: [],
      unknown: [],
    })
    expect(resolveMockModules(undefined, 'orders')).toEqual({
      enabled: false,
      modules: [],
      unknown: [],
    })
  })
})
