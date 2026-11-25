import { catalogHandlers } from './catalog'
import { ordersHandlers } from './orders'
import { routesHandlers } from './routes'
import { stopsHandlers } from './stops'

/** Handlers MSW de prueba; reflejan los endpoints documentados en `docs/endpoints.md`. */
export const testHandlers = [
  ...ordersHandlers,
  ...stopsHandlers,
  ...routesHandlers,
  ...catalogHandlers,
]
