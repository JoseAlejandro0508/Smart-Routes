import { isAxiosError } from 'axios'

/**
 * Capacidades opcionales del backend que el frontend ya consume.
 *
 * Se mantienen apagadas mientras el endpoint no exista en el backend. Al
 * implementarlo, cambia el valor a `true` y la pantalla se conecta sin más
 * cambios. Contrato esperado en `docs/endpoints.md` §15.
 */
export const backendCapabilities = {
  /** `GET /api/dashboard/summary` */
  dashboardSummary: false,
  /** `GET /api/reports/{reportId}` */
  reports: false,
}

/**
 * Detecta si un error corresponde a un endpoint que todavía no existe en el
 * backend (404) o que está marcado como no implementado (501). Permite mostrar
 * “Pendiente de backend” en lugar de un error visible.
 */
export function isBackendPending(error: unknown): boolean {
  if (!isAxiosError(error)) return false
  const status = error.response?.status
  return status === 404 || status === 501
}
