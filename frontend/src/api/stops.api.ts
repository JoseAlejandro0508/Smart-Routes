import { http } from './http'

/** Parada de entrega registrada para asignarse a pedidos. */
export interface Stop {
  id: number
  address: string
  zoneId: number
  zoneName: string
  /** Latitud, o `null` si la parada aún no está ubicada en el mapa. */
  latitude?: number | null
  /** Longitud, o `null` si la parada aún no está ubicada en el mapa. */
  longitude?: number | null
}

/** Datos para crear o actualizar una parada. */
export interface StopPayload {
  address: string
  zoneId: number
  /** Latitud opcional; si falta, el backend geocodifica la dirección. */
  latitude?: number
  /** Longitud opcional; debe enviarse junto con la latitud. */
  longitude?: number
}

/** Cliente de API para la gestión de paradas. */
export const stopsApi = {
  /** Lista las paradas; con `zoneId`, solo las de esa zona. */
  async list(zoneId?: number): Promise<Stop[]> {
    const { data } = await http.get<Stop[]>('/stops', { params: { zoneId } })
    return data
  },

  /** Registra una nueva parada. */
  async create(payload: StopPayload): Promise<Stop> {
    const { data } = await http.post<Stop>('/stops/create-stop', payload)
    return data
  },

  /** Actualiza una parada existente. */
  async update(id: number, payload: StopPayload): Promise<Stop> {
    const { data } = await http.put<Stop>(`/stops/${id}`, payload)
    return data
  },

  /** Elimina una parada sin pedidos ni rutas asociadas. */
  async remove(id: number): Promise<void> {
    await http.delete(`/stops/${id}`)
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
