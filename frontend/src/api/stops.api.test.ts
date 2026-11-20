// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { http } from './http'
import { stopsApi, ZONES, zoneNameOf } from './stops.api'

afterEach(() => {
  vi.restoreAllMocks()
})

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

describe('stopsApi', () => {
  it('lista las paradas y reenvía el filtro de zona', async () => {
    const get = vi.spyOn(http, 'get').mockResolvedValue({ data: [] } as never)

    await stopsApi.list(2)

    expect(get).toHaveBeenCalledWith('/stops', { params: { zoneId: 2 } })
  })

  it('crea la parada en el endpoint del backend', async () => {
    const post = vi.spyOn(http, 'post').mockResolvedValue({ data: {} } as never)
    const payload = { address: 'Calle 1', zoneId: 2 }

    await stopsApi.create(payload)

    expect(post).toHaveBeenCalledWith('/stops/create-stop', payload)
  })

  it('actualiza y elimina por identificador', async () => {
    const put = vi.spyOn(http, 'put').mockResolvedValue({ data: {} } as never)
    const remove = vi.spyOn(http, 'delete').mockResolvedValue({ data: undefined } as never)

    await stopsApi.update(7, { address: 'Calle 2', zoneId: 1 })
    await stopsApi.remove(7)

    expect(put).toHaveBeenCalledWith('/stops/7', { address: 'Calle 2', zoneId: 1 })
    expect(remove).toHaveBeenCalledWith('/stops/7')
  })
})
