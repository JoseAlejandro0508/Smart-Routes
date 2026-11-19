// src/mocks/browser.ts
import { setupWorker } from 'msw/browser'
import type { MockModule } from './config'
import { handlersByModule } from './handlers'

/** Crea el worker de MSW con los handlers de los módulos indicados. */
export function createMockWorker(modules: MockModule[]) {
  return setupWorker(...modules.flatMap((module) => handlersByModule[module]))
}
