import { ArrowDownAZ, ArrowUpAZ, ArrowUpDown } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

/** Valor soportado por una celda de la tabla ordenable. */
export type SortableCell = string | number

/** Fila genérica de la tabla ordenable. */
export type SortableRow = Record<string, SortableCell>

export interface SortableTableProps {
  /** Columnas a mostrar, en orden. */
  columns: string[]
  /** Filas de datos. */
  rows: SortableRow[]
  /** Notifica las filas en el orden actual (inicial y tras cada ordenación). */
  onRowsChange?: (rows: SortableRow[]) => void
}

function compareCells(left: SortableCell, right: SortableCell, ascending: boolean): number {
  const comparison =
    typeof left === 'number' && typeof right === 'number'
      ? left - right
      : String(left).localeCompare(String(right), 'es', { numeric: true, sensitivity: 'base' })
  return ascending ? comparison : -comparison
}

/**
 * Tabla reutilizable con ordenación ascendente/descendente por cualquier columna.
 * Al hacer clic en un encabezado se alterna el sentido; al cambiar de columna
 * se ordena ascendentemente.
 */
export function SortableTable({ columns, rows, onRowsChange }: SortableTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [ascending, setAscending] = useState(true)

  function sortBy(column: string) {
    if (sortColumn === column) {
      setAscending((current) => !current)
    } else {
      setSortColumn(column)
      setAscending(true)
    }
  }

  const sortedRows = useMemo(() => {
    if (!sortColumn) return rows
    return rows.toSorted((left, right) =>
      compareCells(left[sortColumn] ?? '', right[sortColumn] ?? '', ascending),
    )
  }, [rows, sortColumn, ascending])

  useEffect(() => {
    onRowsChange?.(sortedRows)
  }, [sortedRows, onRowsChange])

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            {columns.map((column) => {
              const active = sortColumn === column
              return (
                <th key={column} className="px-5 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => sortBy(column)}
                    className="inline-flex items-center gap-1.5 hover:text-neutral-900"
                    aria-label={`Ordenar por ${column}`}
                  >
                    {column}
                    {active ? (
                      ascending ? (
                        <ArrowDownAZ className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpAZ className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {sortedRows.map((row, index) => (
            <tr key={index} className="hover:bg-neutral-50">
              {columns.map((column) => (
                <td key={column} className="px-5 py-4 text-neutral-700">
                  {String(row[column] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
