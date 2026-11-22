import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SortableCell, SortableRow } from './SortableTable'

const COLORS = ['#171717', '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed']

function isNumeric(value: SortableCell | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Propiedades del gráfico de barras de reportes. */
export interface ReportChartProps {
  /** Columnas del reporte, en orden. */
  columns: string[]
  /** Filas a representar (respeta el orden/filtros actuales). */
  rows: SortableRow[]
  /** Título accesible del gráfico. */
  title?: string
}

/**
 * Gráfico de barras para los resultados de un reporte. Usa la primera columna
 * no numérica como etiqueta y representa las columnas numéricas como series.
 */
export function ReportChart({ columns, rows, title }: ReportChartProps) {
  const numericColumns = columns.filter((column) => rows.some((row) => isNumeric(row[column])))
  const labelColumn =
    columns.find((column) => !numericColumns.includes(column)) ?? columns[0] ?? 'label'

  if (numericColumns.length === 0 || rows.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-500">
        No hay datos numéricos para graficar.
      </div>
    )
  }

  const data = rows.map((row, index) => ({
    name: String(row[labelColumn] ?? `Fila ${index + 1}`),
    ...Object.fromEntries(numericColumns.map((column) => [column, Number(row[column] ?? 0)])),
  }))

  return (
    <div className="h-80 w-full" role="img" aria-label={title ?? 'Gráfico del reporte'}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={rows.length > 6 ? -20 : 0} textAnchor={rows.length > 6 ? 'end' : 'middle'} height={rows.length > 6 ? 60 : 30} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          {numericColumns.length > 1 && <Legend />}
          {numericColumns.map((column, index) => (
            <Bar key={column} dataKey={column} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]}>
              {numericColumns.length === 1 &&
                data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
