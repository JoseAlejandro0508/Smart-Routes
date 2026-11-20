import { http } from './http'

/** Zona geográfica administrable. */
export interface Zone {
  id: number
  name: string
}

/** Centro de distribución con su cobertura. */
export interface DistributionCenter {
  id: number
  name: string
  logisticsProgram: string
  latitude?: number | null
  longitude?: number | null
  coveredZoneIds: number[]
}

/** Datos para crear o actualizar un centro. */
export interface CenterPayload {
  name: string
  logisticsProgram: string
  latitude?: number
  longitude?: number
  coveredZoneIds: number[]
}

/** Datos para crear o actualizar una zona. */
export interface ZonePayload {
  name: string
}

/** Cliente de API para centros de distribución y zonas. */
export const centersApi = {
  /** Lista los centros con sus zonas cubiertas. */
  async list(): Promise<DistributionCenter[]> {
    const { data } = await http.get<DistributionCenter[]>('/admin/distribution-center/get-all')
    return data
  },

  /** Crea un centro de distribución. */
  async create(payload: CenterPayload): Promise<void> {
    await http.post('/admin/distribution-center/create-distribution-center', payload)
  },

  /** Actualiza los datos y la cobertura de un centro. */
  async update(id: number, payload: CenterPayload): Promise<void> {
    await http.put(`/admin/distribution-center/${id}`, payload)
  },

  /** Elimina un centro sin pedidos ni rutas. */
  async remove(id: number): Promise<void> {
    await http.delete(`/admin/distribution-center/${id}`)
  },

  /** Lista todas las zonas. */
  async listZones(): Promise<Zone[]> {
    const { data } = await http.get<Zone[]>('/admin/zones/get-all')
    return data
  },

  /** Crea una zona. */
  async createZone(payload: ZonePayload): Promise<void> {
    await http.post('/admin/zones/create-zone', payload)
  },

  /** Renombra una zona. */
  async updateZone(id: number, payload: ZonePayload): Promise<void> {
    await http.put(`/admin/zones/${id}`, payload)
  },

  /** Elimina una zona sin paradas ni centros asociados. */
  async removeZone(id: number): Promise<void> {
    await http.delete(`/admin/zones/${id}`)
  },
}
