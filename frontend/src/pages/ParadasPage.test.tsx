import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { tokenStore } from '../api/http'
import { resetTestDb, testDb } from '../test/handlers/data'
import { TEST_ACCESS_TOKEN, TEST_REFRESH_TOKEN } from '../test/handlers/shared'
import { server } from '../test/server'
import { ParadasPage } from './ParadasPage'

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

    expect(testDb.stops[0]).toMatchObject({
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
