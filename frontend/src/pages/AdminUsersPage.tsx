// src/pages/AdminUsersPage.tsx — pantalla provisional (solo admin)
import { UserCog } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'

// Administración de usuarios y roles: asignar y quitar roles. El
// backend YA tiene estos endpoints (GetAllUserRoles, UpdateUserRole,
// DeleteUserRole) — esta pantalla se conectará a ellos.
export function AdminUsersPage() {
  return (
    <EmptyState
      icon={UserCog}
      titulo="Usuarios y roles"
      descripcion="Gestión de los usuarios del sistema y sus roles (administrador, coordinador, supervisor, repartidor). El backend ya expone los endpoints: esta pantalla se conectará a ellos."
    />
  )
}
