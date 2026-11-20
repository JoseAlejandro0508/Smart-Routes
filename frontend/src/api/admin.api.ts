import { http } from './http'
import type { UserRole } from './auth.api'

/** Usuario con el rol asignado, según la vista de administración. */
export interface AdminUser {
  id: string
  email: string
  name: string
  role: UserRole | ''
  active: boolean
}

/** Repartidor registrado con su perfil operativo. */
export interface DeliveryPersonSummary {
  id: string
  email: string
  name: string
  dateOfBirth: string
  fleet: string
}

/** Coordinador logístico registrado. */
export interface CoordinatorSummary {
  id: string
  email: string
  name: string
  specialty: string
  authorizedCenterIds: number[]
}

/** Supervisor de operaciones registrado. */
export interface SupervisorSummary {
  id: string
  email: string
  name: string
  controlArea: string
}

/** Cliente de API para administración de usuarios y actores. */
export const adminApi = {
  async listUsers(): Promise<AdminUser[]> {
    const { data } = await http.get<AdminUser[]>('/admin/manage-roles/users')
    return data
  },

  async setUserRole(userId: string, role: UserRole | ''): Promise<void> {
    await http.put(`/admin/manage-roles/users/${userId}/role`, { role })
  },

  async listDeliveryPersons(): Promise<DeliveryPersonSummary[]> {
    const { data } = await http.get<DeliveryPersonSummary[]>('/admin/manage-roles/delivery-persons')
    return data
  },

  async listCoordinators(): Promise<CoordinatorSummary[]> {
    const { data } = await http.get<CoordinatorSummary[]>('/admin/manage-roles/coordinators')
    return data
  },

  async listSupervisors(): Promise<SupervisorSummary[]> {
    const { data } = await http.get<SupervisorSummary[]>('/admin/manage-roles/supervisors')
    return data
  },
}
