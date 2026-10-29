// src/components/layout/navConfig.ts
// La navegación es DATA-DRIVEN: cada ítem declara a qué ruta lleva, su
// icono y a qué ROLES se muestra. El menú se auto-filtra según el usuario
// de la sesión → agregar una sección nueva es añadir UNA LÍNEA aquí,
// no tocar el componente del menú.
// Los roles son los del contrato real del backend (Roles.cs).
import {
  BarChart3,
  Home,
  Package,
  Route,
  Truck,
  UserCog,
  Warehouse,
} from 'lucide-react'
import type { UserRole } from '../../api/auth.api'

export interface NavItem {
  to: string
  label: string
  icon: typeof Home // tipo de un icono lucide (todos comparten firma)
  roles: UserRole[]
}

// Etiquetas legibles para los roles del contrato (UI en español)
export const ROLE_LABELS: Record<UserRole, string> = {
  Administrator: 'Administrador',
  LogisticsCoordinator: 'Coordinador logístico',
  OperationsSupervisor: 'Supervisor de operaciones',
  DeliveryPerson: 'Repartidor',
}

// Matriz de permisos del enunciado:
//  - Pedidos/Rutas/Reportes: todos los roles los ven (quién EDITA se
//    decidirá dentro de cada sección)
//  - Repartidores/Centros/Administración: gestión del administrador
const TODOS: UserRole[] = [
  'Administrator',
  'LogisticsCoordinator',
  'OperationsSupervisor',
  'DeliveryPerson',
]
const SOLO_ADMIN: UserRole[] = ['Administrator']

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: Home, roles: TODOS },
  { to: '/pedidos', label: 'Pedidos', icon: Package, roles: TODOS },
  { to: '/rutas', label: 'Rutas', icon: Route, roles: TODOS },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, roles: TODOS },
  { to: '/repartidores', label: 'Repartidores', icon: Truck, roles: SOLO_ADMIN },
  { to: '/centros', label: 'Centros', icon: Warehouse, roles: SOLO_ADMIN },
  { to: '/admin', label: 'Administración', icon: UserCog, roles: SOLO_ADMIN },
]
