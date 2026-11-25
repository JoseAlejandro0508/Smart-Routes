import { setupServer } from 'msw/node'
import { testHandlers } from './handlers'

/** Servidor MSW compartido por las pruebas de integración de las páginas. */
export const server = setupServer(...testHandlers)
