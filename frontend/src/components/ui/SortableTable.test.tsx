import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SortableTable } from './SortableTable'

const columns = ['Nombre', 'Edad']
const rows = [
  { Nombre: 'Beto', Edad: 30 },
  { Nombre: 'Ana', Edad: 25 },
  { Nombre: 'Carlos', Edad: 40 },
]

function getColumnValues(columnIndex: number): string[] {
  const bodyRows = screen.getAllByRole('row').slice(1)
  return bodyRows.map((row) => within(row).getAllByRole('cell')[columnIndex].textContent ?? '')
}

describe('SortableTable', () => {
  it('ordena ascendente y descendente al hacer clic en una columna', async () => {
    const user = userEvent.setup()
    render(<SortableTable columns={columns} rows={rows} />)

    await user.click(screen.getByRole('button', { name: 'Ordenar por Nombre' }))
    expect(getColumnValues(0)).toEqual(['Ana', 'Beto', 'Carlos'])

    await user.click(screen.getByRole('button', { name: 'Ordenar por Nombre' }))
    expect(getColumnValues(0)).toEqual(['Carlos', 'Beto', 'Ana'])
  })

  it('ordena numéricamente y reinicia a ascendente al cambiar de columna', async () => {
    const user = userEvent.setup()
    render(<SortableTable columns={columns} rows={rows} />)

    await user.click(screen.getByRole('button', { name: 'Ordenar por Edad' }))
    expect(getColumnValues(1)).toEqual(['25', '30', '40'])

    await user.click(screen.getByRole('button', { name: 'Ordenar por Nombre' }))
    expect(getColumnValues(0)).toEqual(['Ana', 'Beto', 'Carlos'])
  })

  it('notifica las filas en el orden actual', async () => {
    const user = userEvent.setup()
    const onRowsChange = vi.fn()
    render(<SortableTable columns={columns} rows={rows} onRowsChange={onRowsChange} />)

    await user.click(screen.getByRole('button', { name: 'Ordenar por Edad' }))
    const last = onRowsChange.mock.calls.at(-1)?.[0] as Array<Record<string, string | number>>
    expect(last.map((row) => row.Edad)).toEqual([25, 30, 40])
  })
})
