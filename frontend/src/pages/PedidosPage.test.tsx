import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStore } from '../api/http'
import { ordersHandlers } from '../mocks/handlers/orders'
import { stopsHandlers } from '../mocks/handlers/stops'
import { mockState } from '../mocks/state'
import { tokensFor } from '../mocks/shared'
import { PedidosPage } from './PedidosPage'

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

const server = setupServer(...ordersHandlers, ...stopsHandlers)
const originalOrders = [...mockState.orders]

beforeAll(() => server.listen())
afterAll(() => server.close())

beforeEach(() => {
  mockState.orders = [...originalOrders]
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
      <PedidosPage />
    </QueryClientProvider>,
  )
}

describe('PedidosPage', () => {
  it('valida los campos obligatorios antes de enviar el formulario', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Nuevo pedido' }))
    await user.click(screen.getByRole('button', { name: 'Registrar pedido' }))

    expect(
      screen.getByText('Completa descripción, parada, peso, fecha de ingreso y fecha límite.'),
    ).toBeInTheDocument()
  })

  it('registra un pedido con una parada existente y lo muestra en la tabla', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Nuevo pedido' }))

    await user.type(screen.getByLabelText('Descripción'), 'Pedido de prueba')
    await user.type(screen.getByLabelText('Fecha límite'), '2026-12-01T10:30')

    const stopSelect = await screen.findByRole('combobox', { name: /Parada/ })
    await screen.findByRole('option', { name: 'Centro · Calle 23 #456' })
    await user.selectOptions(stopSelect, '1')

    await user.click(screen.getByRole('button', { name: 'Registrar pedido' }))

    await waitFor(
      () => {
        expect(screen.queryByRole('heading', { name: 'Registrar pedido' })).not.toBeInTheDocument()
      },
      { timeout: 5000 },
    )

    expect(await screen.findByText(/Pedido de prueba/)).toBeInTheDocument()
    expect(mockState.orders[0]?.description).toBe('Pedido de prueba')
    expect(mockState.orders[0]?.zoneName).toBe('Centro')
  })
})
