import { HttpResponse } from 'msw'

/** Token simple usado por las pruebas; no representa un JWT real. */
export const TEST_ACCESS_TOKEN = 'test-access-token'
/** Refresh token simbólico; las pruebas no ejercitan la renovación. */
export const TEST_REFRESH_TOKEN = 'test-refresh-token'

/** Comprueba que la petición lleve el token de prueba. */
export function isAuthorized(request: Request) {
  return request.headers.get('Authorization') === `Bearer ${TEST_ACCESS_TOKEN}`
}

/** Respuesta 401 sin cuerpo, equivalente al middleware del backend. */
export function unauthorized() {
  return new HttpResponse(null, { status: 401 })
}

/** Error de validación con la forma de `ProblemDetails`. */
export function badRequest(detail: string, errors?: Record<string, string[]>) {
  return problem(400, 'One or more validation errors occurred.', detail, errors)
}

/** Recurso inexistente con la forma de `ProblemDetails`. */
export function notFound(detail: string) {
  return problem(404, 'Not Found', detail)
}

/** Conflicto de negocio con la forma de `ProblemDetails`. */
export function conflict(detail: string) {
  return problem(409, 'Conflict', detail)
}

function problem(status: number, title: string, detail: string, errors?: Record<string, string[]>) {
  return HttpResponse.json(
    {
      type: `https://tools.ietf.org/html/rfc9110#section-15.5.${status === 400 ? '1' : '4'}`,
      title,
      status,
      detail,
      ...(errors ? { errors } : {}),
    },
    { status },
  )
}
