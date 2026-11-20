import { http } from './http'
import type { UserRole } from './auth.api'

/** Usuario con el rol asignado, según la vista de administración. */
export interface AdminUserRole {
  id: string
  name: string
  email: string
  role: UserRole | null
}

/** Cliente de API para la administración de roles de usuario. */
export const adminApi = {
  async listUserRoles(): Promise<AdminUserRole[]> {
    const { data } = await http.get<AdminUserRole[]>('/admin/getallusersroles')
    return data
  },

  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    await http.put('/admin/addrole', { userId, role })
  },

  async deleteUserRole(userId: string): Promise<void> {
    await http.delete(`/admin/deleterole/${userId}`)
  },
}