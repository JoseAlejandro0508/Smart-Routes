import { http } from './http'

export interface CreateDeliveryPersonPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  birthDay: string
  fleet: string
  distributionCenterIds: number[]
}

export interface CreateCoordinatorPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  specialty: string
  authorizedCenterIds: number[]
}

export interface CreateSupervisorPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  controlArea: string
}

/** Cliente de API para creación de actores con cuenta de usuario. */
export const actorsApi = {
  async createDeliveryPerson(payload: CreateDeliveryPersonPayload): Promise<string> {
    const { data } = await http.post<string>('/admin/manage-roles/create-delivery-person-full', payload)
    return data
  },

  async createCoordinator(payload: CreateCoordinatorPayload): Promise<string> {
    const { data } = await http.post<string>('/admin/manage-roles/create-coordinator-full', payload)
    return data
  },

  async createSupervisor(payload: CreateSupervisorPayload): Promise<string> {
    const { data } = await http.post<string>('/admin/manage-roles/create-supervisor-full', payload)
    return data
  },
}
