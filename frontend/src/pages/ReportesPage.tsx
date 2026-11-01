import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDownAZ, ArrowUpAZ, BarChart3, Download, FileText } from 'lucide-react'
import { reportsApi, type ReportCell, type ReportId } from '../api/reports.api'

const reportOptions: Array<{ id: ReportId; label: string }> = [
  { id: 'generated-routes', label: 'Rutas generadas por centro' },
  { id: 'managed-orders', label: 'Pedidos más gestionados' },
  { id: 'validated-routes', label: 'Rutas validadas por revisor' },
  { id: 'delivery-performance', label: 'Desempeño de repartidores' },
  { id: 'center-comparison', label: 'Comparación entre centros' },
  { id: 'priority-correlation', label: 'Prioridad y rendimiento' },
]

function printable(value: ReportCell) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character)
}

function exportPdf(title: string, columns: string[], rows: Record<string, ReportCell>[]) {
  const popup = window.open('', '_blank', 'noopener,noreferrer')
  if (!popup) return
  const head = columns.map((column) => `<th>${printable(column)}</th>`).join('')
  const body = rows.map((row) => `<tr>${columns.map((column) => `<td>${printable(row[column])}</td>`).join('')}</tr>`).join('')
  popup.document.write(`<html><head><title>${printable(title)}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#171717}h1{font-size:20px}table{border-collapse:collapse;width:100%;margin-top:20px}th,td{border:1px solid #d4d4d4;padding:8px;text-align:left;font-size:12px}th{background:#f5f5f5}</style></head><body><h1>${printable(title)}</h1><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`)
  popup.document.close()
}

export function ReportesPage() {
  const [reportId, setReportId] = useState<ReportId>('generated-routes')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [ascending, setAscending] = useState(true)
  const report = useQuery({ queryKey: ['report', reportId], queryFn: () => reportsApi.get(reportId) })

  function sortBy(column: string) {
    if (sortColumn === column) setAscending((current) => !current)
    else { setSortColumn(column); setAscending(true) }
  }

  const sortedRows = report.data?.rows.toSorted((left, right) => {
    if (!sortColumn) return 0
    const first = left[sortColumn]
    const second = right[sortColumn]
    const comparison = typeof first === 'number' && typeof second === 'number' ? first - second : String(first).localeCompare(String(second), 'es')
    return ascending ? comparison : -comparison
  }) ?? []
  const numericColumn = report.data?.columns.find((column) => report.data?.rows.some((row) => typeof row[column] === 'number'))
  const numericValues = numericColumn ? report.data?.rows.map((row) => Number(row[numericColumn])) ?? [] : []
  const maxValue = Math.max(...numericValues, 1)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-neutral-500">Análisis</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Reportes</h1><p className="mt-1 text-sm text-neutral-500">Consulta resultados operativos, ordénalos y expórtalos para su revisión.</p></div>{report.data && <button type="button" onClick={() => exportPdf(report.data!.title, report.data!.columns, sortedRows)} className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700"><Download className="h-4 w-4" /> Exportar PDF</button>}</header>
      <label className="block max-w-xl text-sm font-medium text-neutral-700">Reporte a consultar<select value={reportId} onChange={(event) => { setReportId(event.target.value as ReportId); setSortColumn(null) }} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 outline-none focus:border-neutral-500">{reportOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
      {report.isPending ? <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">Generando reporte…</div> : report.isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center text-sm text-rose-700">No se pudo cargar el reporte.</div> : report.data && <><section className="rounded-2xl border border-neutral-200 bg-white p-5"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><BarChart3 className="h-5 w-5" /></span><div><h2 className="font-semibold text-neutral-900">{report.data.title}</h2><p className="mt-1 text-sm text-neutral-500">{report.data.description}</p></div></div>{numericColumn && <div className="mt-6 space-y-3"><p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Resumen visual</p>{report.data.rows.map((row, index) => <div key={`${String(row[numericColumn])}-${index}`} className="flex items-center gap-3 text-sm"><span className="w-32 truncate text-neutral-600">{String(row[report.data!.columns[0]])}</span><div className="h-2 flex-1 rounded-full bg-neutral-100"><div className="h-2 rounded-full bg-neutral-900" style={{ width: `${(Number(row[numericColumn]) / maxValue) * 100}%` }} /></div><span className="w-14 text-right font-medium text-neutral-800">{String(row[numericColumn])}</span></div>)}</div>}</section><section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"><div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4"><p className="text-sm text-neutral-500">{sortedRows.length} filas</p><FileText className="h-5 w-5 text-neutral-400" /></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500"><tr>{report.data.columns.map((column) => <th key={column} className="px-5 py-3 font-medium"><button type="button" onClick={() => sortBy(column)} className="inline-flex items-center gap-1.5 hover:text-neutral-900">{column}{sortColumn === column ? ascending ? <ArrowDownAZ className="h-3.5 w-3.5" /> : <ArrowUpAZ className="h-3.5 w-3.5" /> : null}</button></th>)}</tr></thead><tbody className="divide-y divide-neutral-100">{sortedRows.map((row, index) => <tr key={index} className="hover:bg-neutral-50">{report.data!.columns.map((column) => <td key={column} className="px-5 py-4 text-neutral-700">{String(row[column])}</td>)}</tr>)}</tbody></table></div></section></>}
    </div>
  )
}