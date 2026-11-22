import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStore } from '../api/http'
import { stopsHandlers } from '../mocks/handlers/stops'
import { mockState } from '../mocks/state'
import { tokensFor } from '../mocks/shared'
import { ParadasPage } from './ParadasPage'

const auth = vi.hoisted(() => ({
  user: {
    id: 'usr_01',
    name: 'Ana Demo',
    email: 'ana@demo.dev',
    role: 'LogisticsCoordinator',
  },
  isInitializing: false,
}))

vi.mock('../features/auth/AuthProvider', () => ({
  useAuth: () => auth,
}))

const server = setupServer(...stopsHandlers)
const originalStops = [...mockState.stops]

beforeAll(() => server.listen())
afterAll(() => server.close())

beforeEach(() => {
  mockState.stops = [...originalStops]
  const { accessToken, refreshToken } = tokensFor('usr_01')
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
      <ParadasPage />
    </QueryClientProvider>,
  )
}

describe('ParadasPage', () => {
  it('registra una parada y la muestra en la tabla', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('Calle 23 #456')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Nueva parada' }))
    await user.type(screen.getByLabelText('Dirección'), 'Calle Nueva 99')
    await user.selectOptions(screen.getByLabelText('Zona'), '2')
    await user.click(screen.getByRole('button', { name: 'Registrar parada' }))

    await waitFor(
      () => {
        expect(screen.getByText('Calle Nueva 99')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )

    expect(mockState.stops[0]).toMatchObject({
      address: 'Calle Nueva 99',
      zoneId: 2,
      zoneName: 'Vedado',
    })
  })

  it('filtra por la zona seleccionada usando la consulta a la API', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Calle 23 #456')
    await user.selectOptions(screen.getByLabelText('Filtrar por zona'), '2')

    expect(await screen.findByText('Avenida 5ta #120')).toBeInTheDocument()
    expect(screen.queryByText('Calle 23 #456')).not.toBeInTheDocument()
  })
})
