import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStore } from '../api/http'
import { routesHandlers } from '../mocks/handlers/routes'
import { mockState } from '../mocks/state'
import { tokensFor } from '../mocks/shared'
import { RutasPage } from './RutasPage'

const auth = vi.hoisted(() => ({
  user: {
    id: 'usr_03',
    name: 'Sofía Demo',
    email: 'sofia@demo.dev',
    role: 'OperationsSupervisor',
  },
  isInitializing: false,
}))

vi.mock('../features/auth/AuthProvider', () => ({
  useAuth: () => auth,
}))

const server = setupServer(...routesHandlers)
const originalStatuses = mockState.routes.map((route) => route.status)

beforeAll(() => server.listen())
afterAll(() => server.close())

beforeEach(() => {
  mockState.routes.forEach((route, index) => {
    route.status = originalStatuses[index] ?? route.status
  })
  const { accessToken, refreshToken } = tokensFor('usr_03')
  tokenStore.set(accessToken, refreshToken)
})

afterEach(() => {
  server.resetHandlers()
  tokenStore.clear()
})

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <RutasPage />
    </QueryClientProvider>,
  )
}

describe('RutasPage (supervisor)', () => {
  it('exige una observación antes de rechazar una ruta', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('heading', { name: 'Ruta #201' })
    await user.click(screen.getByRole('button', { name: 'Rechazar' }))

    expect(
      screen.getByText('Escribe una observación antes de rechazar la ruta.'),
    ).toBeInTheDocument()
  })

  it('rechaza una ruta con observación y actualiza su estado', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('heading', { name: 'Ruta #201' })
    await user.type(
      screen.getByPlaceholderText('Observaciones para la revisión o el rechazo'),
      'Revisar la cobertura de la zona.',
    )
    await user.click(screen.getByRole('button', { name: 'Rechazar' }))

    await waitFor(
      () => {
        expect(mockState.routes.find((route) => route.id === 201)?.status).toBe('Rejected')
      },
      { timeout: 5000 },
    )
    expect((await screen.findAllByText('Rechazada')).length).toBeGreaterThan(0)
  })
})
