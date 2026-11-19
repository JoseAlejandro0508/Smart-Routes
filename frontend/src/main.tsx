// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { resolveMockModules } from './mocks/config'

async function enableMocking() {
  const { enabled, modules, unknown } = resolveMockModules(
    import.meta.env.VITE_ENABLE_MOCKS,
    import.meta.env.VITE_MOCKS,
  )

  if (unknown.length > 0) {
    console.warn(`[MSW] Módulos desconocidos en VITE_MOCKS: ${unknown.join(', ')}`)
  }
  if (!enabled || modules.length === 0) return

  const { createMockWorker } = await import('./mocks/browser')
  console.info(`[MSW] Módulos simulados: ${modules.join(', ')}`)
  return createMockWorker(modules).start({ onUnhandledFrame: 'warn' })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
