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

beforeAll(() => server.listen())
afterAll(() => server.close())

beforeEach(() => {
  ;(mockState as any).routeReviews[201] = 'Pending'
  ;(mockState as any).routeReviews[202] = 'Approved'
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

    await user.selectOptions(screen.getByLabelText('Estado'), 'Pending')
    await screen.findByRole('heading', { name: 'Ruta #201' })
    await user.click(screen.getByRole('button', { name: 'Rechazar' }))

    expect(
      screen.getByText('Escribe una observación antes de rechazar la ruta.'),
    ).toBeInTheDocument()
  })

  it('rechaza una ruta con observación y actualiza su estado', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.selectOptions(screen.getByLabelText('Estado'), 'Pending')
    await screen.findByRole('heading', { name: 'Ruta #201' })
    await user.type(
      screen.getByPlaceholderText('Observaciones para la revisión o el rechazo'),
      'Revisar la cobertura de la zona.',
    )
    await user.click(screen.getByRole('button', { name: 'Rechazar' }))

    await waitFor(
      () => {
        expect((mockState as any).routeReviews[201]).toBe('Rejected')
      },
      { timeout: 5000 },
    )
  })
})
