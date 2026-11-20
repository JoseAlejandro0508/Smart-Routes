// src/mocks/config.ts
// Resolución de qué módulos de MSW se activan (VITE_ENABLE_MOCKS + VITE_MOCKS).
// No importa handlers a propósito: main.tsx puede usarlo sin arrastrar
// los mocks al bundle de producción.
export const MOCK_MODULES = [
  'auth',
  'dashboard',
  'orders',
  'stops',
  'routes',
  'admin',
  'reports',
] as const

export type MockModule = (typeof MOCK_MODULES)[number]

export interface MockSelection {
  /** false si el interruptor maestro no está en "true". */
  enabled: boolean
  /** Módulos que deben mockearse (en el orden de MOCK_MODULES). */
  modules: MockModule[]
  /** Nombres de VITE_MOCKS que no corresponden a ningún módulo. */
  unknown: string[]
}

/**
 * Decide qué módulos de MSW activar.
 *
 * - `master !== 'true'` → desactivado.
 * - `selection` vacío o ausente → todos los módulos.
 * - `selection = 'auth,orders'` → solo esos.
 * - Los nombres desconocidos se devuelven en `unknown` y se ignoran.
 */
export function resolveMockModules(
  master: string | undefined,
  selection: string | undefined,
): MockSelection {
  if (master !== 'true') return { enabled: false, modules: [], unknown: [] }

  const raw = (selection ?? '').trim()
  if (!raw) return { enabled: true, modules: [...MOCK_MODULES], unknown: [] }

  const requested = raw
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean)
  const modules = MOCK_MODULES.filter((name) => requested.includes(name))
  const unknown = requested.filter(
    (name) => !(MOCK_MODULES as readonly string[]).includes(name),
  )

  return { enabled: modules.length > 0, modules, unknown }
}
