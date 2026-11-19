import { http } from './http'

/** Parada de entrega registrada para asignarse a pedidos. */
export interface Stop {
  id: number
  address: string
  zoneId: number
  zoneName: string
}

/** Datos para crear o actualizar una parada. */
export interface StopPayload {
  address: string
  zoneId: number
}

/** Cliente de API para la gestión de paradas. */
export const stopsApi = {
  /** Lista todas las paradas registradas. */
  async list(): Promise<Stop[]> {
    const { data } = await http.get<Stop[]>('/stops')
    return data
  },

  /** Registra una nueva parada. */
  async create(payload: StopPayload): Promise<Stop> {
    const { data } = await http.post<Stop>('/stops', payload)
    return data
  },

  /** Actualiza una parada existente. */
  async update(id: number, payload: StopPayload): Promise<Stop> {
    const { data } = await http.put<Stop>(`/stops/${id}`, payload)
    return data
  },
}


/** Zonas disponibles para asignar paradas. */
export const ZONES: Array<{ id: number; name: string }> = [
  { id: 1, name: 'Centro' },
  { id: 2, name: 'Vedado' },
  { id: 3, name: 'Plaza' },
]

/** Devuelve el nombre de la zona para un identificador dado. */
export function zoneNameOf(zoneId: number): string {
  return ZONES.find((zone) => zone.id === zoneId)?.name ?? 'Desconocida'
}
