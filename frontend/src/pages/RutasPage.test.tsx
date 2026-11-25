import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStore } from '../api/http'
import { resetTestDb, testDb } from '../test/handlers/data'
import { TEST_ACCESS_TOKEN, TEST_REFRESH_TOKEN } from '../test/handlers/shared'
import { server } from '../test/server'
import { RutasPage } from './RutasPage'

const auth = vi.hoisted(() => ({
  user: {
    id: 'test-supervisor',
    name: 'Supervisor de prueba',
    email: 'supervisor@test.dev',
    role: 'OperationsSupervisor',
  },
  isInitializing: false,
}))

vi.mock('../features/auth/AuthProvider', () => ({
  useAuth: () => auth,
}))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())

beforeEach(() => {
  resetTestDb()
  tokenStore.set(TEST_ACCESS_TOKEN, TEST_REFRESH_TOKEN)
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
        expect(testDb.reviews[201]).toBe('Rejected')
      },
      { timeout: 5000 },
    )
  })
})
