// src/mocks/handlers/index.ts
// Mapa de módulos de mock. Para retirar un módulo ya conectado a la API real:
// borrar su entrada de aquí y su archivo de handlers.
import type { RequestHandler } from 'msw'
import type { MockModule } from '../config'
import { adminHandlers } from './admin'
import { authHandlers } from './auth'
import { dashboardHandlers } from './dashboard'
import { deliveriesHandlers } from './deliveries'
import { ordersHandlers } from './orders'
import { reportsHandlers } from './reports'
import { reschedulingsHandlers } from './reschedulings'
import { routesHandlers } from './routes'

/** Handlers de MSW agrupados por módulo funcional. */
export const handlersByModule = {
  auth: authHandlers,
  dashboard: dashboardHandlers,
  orders: ordersHandlers,
  routes: routesHandlers,
  deliveries: deliveriesHandlers,
  reschedulings: reschedulingsHandlers,
  admin: adminHandlers,
  reports: reportsHandlers,
} satisfies Record<MockModule, RequestHandler[]>
