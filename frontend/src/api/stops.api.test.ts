// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ZONES, zoneNameOf } from './stops.api'

describe('stops.api', () => {
  it('expone las zonas disponibles', () => {
    expect(ZONES).toEqual([
      { id: 1, name: 'Centro' },
      { id: 2, name: 'Vedado' },
      { id: 3, name: 'Plaza' },
    ])
  })

  it('resuelve el nombre de zona por id', () => {
    expect(zoneNameOf(1)).toBe('Centro')
    expect(zoneNameOf(2)).toBe('Vedado')
    expect(zoneNameOf(99)).toBe('Desconocida')
  })
})
