import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Download, FileText, PackageCheck, Table2 } from 'lucide-react'
import { deliveriesApi } from '../api/deliveries.api'
import { backendCapabilities, isBackendPending } from '../api/capabilities'
import { reportsApi, type ReportId } from '../api/reports.api'
import { ReportChart } from '../components/ui/ReportChart'
import { SortableTable, type SortableRow } from '../components/ui/SortableTable'
import { useAuth } from '../features/auth/AuthProvider'
import { exportElementToPdf } from '../utils/exportPdf'

const reportOptions: Array<{ id: ReportId; label: string }> = [
  { id: 'generated-routes', label: 'Rutas generadas por centro' },
  { id: 'managed-orders', label: 'Pedidos más gestionados' },
  { id: 'validated-routes', label: 'Rutas validadas por revisor' },
  { id: 'delivery-performance', label: 'Desempeño de repartidores' },
  { id: 'center-comparison', label: 'Comparación entre centros' },
  { id: 'priority-correlation', label: 'Prioridad y rendimiento' },
]

/** Página de reportes operativos con vista en tabla/gráfico y exportación a PDF. */
export function ReportesPage() {
  const { user } = useAuth()
  const [reportId, setReportId] = useState<ReportId>('generated-routes')
  const [view, setView] = useState<'table' | 'chart'>('table')
  const [sortedRows, setSortedRows] = useState<SortableRow[]>([])
  const [exporting, setExporting] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const [filters, setFilters] = useState<Record<string, string>>({})
  const reportsAvailable = backendCapabilities.reports
  const report = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => reportsApi.get(reportId),
    enabled: reportsAvailable,
  })
  const reportsPending = !reportsAvailable || isBackendPending(report.error)
  const canViewDeliveryReports = user?.role === 'Administrator' || user?.role === 'OperationsSupervisor' || user?.role === 'LogisticsCoordinator'
  const deliveryReports = useQuery({
    queryKey: ['delivery-reports-by-center'],
    queryFn: deliveriesApi.getReportsByCenter,
    enabled: canViewDeliveryReports,
    refetchInterval: 30_000,
  })
  const currentOption = reportOptions.find((option) => option.id === reportId)

  const rows = useMemo<SortableRow[]>(
    () => (report.data?.rows ?? []) as SortableRow[],
    [report.data],
  )

  const displayedRows = useMemo(() => {
    let result = rows
    const zone = filters.zone?.trim().toLowerCase()
    const priority = filters.priority?.trim().toLowerCase()
    const center = filters.center?.trim().toLowerCase()
    if (zone) result = result.filter((r) => String(r['Zona'] ?? r['zona'] ?? '').toLowerCase().includes(zone))
    if (priority) result = result.filter((r) => String(r['Prioridad'] ?? r['prioridad'] ?? '').toLowerCase().includes(priority))
    if (center) result = result.filter((r) => String(r['Centro'] ?? r['centro'] ?? '').toLowerCase().includes(center))
    if (reportId === 'priority-correlation') result = result.slice(0, 10)
    return result
  }, [rows, filters, reportId])

  async function handleExport() {
    if (!report.data || !exportRef.current) return
    setExporting(true)
    try {
      await exportElementToPdf(exportRef.current, {
        title: report.data.title,
        subtitle: report.data.description,
        filters: [`Reporte: ${currentOption?.label ?? reportId}`, `Vista: ${view === 'table' ? 'Tabla' : 'Gráfico'}`],
        filename: `reporte-${reportId}`,
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-500">Análisis</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Reportes</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Consulta resultados operativos, ordénalos y expórtalos para su revisión.
          </p>
        </div>
        {reportsAvailable && report.data && (
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
          >
            <Download className="h-4 w-4" /> {exporting ? 'Exportando…' : 'Exportar PDF'}
          </button>
        )}
      </header>

      {canViewDeliveryReports && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-neutral-500" />
            <h2 className="font-semibold text-neutral-900">Entregas por centro</h2>
          </div>
          <p className="mt-1 text-sm text-neutral-500">Resumen real de entregas registradas en rutas aprobadas.</p>
          {deliveryReports.isPending ? (
            <p className="mt-4 text-sm text-neutral-500">Cargando entregas por centro…</p>
          ) : deliveryReports.isError ? (
            <p className="mt-4 text-sm text-rose-700">No se pudieron cargar los reportes de entrega por centro.</p>
          ) : (deliveryReports.data ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">No hay datos de entregas disponibles.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-500">
                    <th className="px-3 py-2 font-medium">Centro</th>
                    <th className="px-3 py-2 font-medium">Rutas aprobadas</th>
                    <th className="px-3 py-2 font-medium">Paradas</th>
                    <th className="px-3 py-2 font-medium">Exitosas</th>
                    <th className="px-3 py-2 font-medium">Fallidas</th>
                    <th className="px-3 py-2 font-medium">Pendientes</th>
                  </tr>
                </thead>
                <tbody>
                  {(deliveryReports.data ?? []).map((item) => (
                    <tr key={item.distributionCenterId} className="border-b border-neutral-100">
                      <td className="px-3 py-2 font-medium text-neutral-900">{item.centerName}</td>
                      <td className="px-3 py-2">{item.approvedRoutes}</td>
                      <td className="px-3 py-2">{item.totalStops}</td>
                      <td className="px-3 py-2 text-emerald-700">{item.successfulDeliveries}</td>
                      <td className="px-3 py-2 text-rose-700">{item.failedDeliveries}</td>
                      <td className="px-3 py-2 text-amber-700">{item.pendingDeliveries}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {reportsAvailable && !reportsPending && (
        <div className="flex flex-wrap items-end gap-4">
          <label className="block w-full max-w-xl text-sm font-medium text-neutral-700">
            Reporte a consultar
            <select
              value={reportId}
              onChange={(event) => {
                setReportId(event.target.value as ReportId)
                setSortedRows([])
              }}
              className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 outline-none focus:border-neutral-500"
            >
              {reportOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {report.data && (
            <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1" role="tablist" aria-label="Vista del reporte">
              <button
                type="button"
                role="tab"
                aria-selected={view === 'table'}
                onClick={() => setView('table')}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${view === 'table' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
              >
                <Table2 className="h-4 w-4" /> Tabla
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'chart'}
                onClick={() => setView('chart')}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${view === 'chart' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
              >
                <BarChart3 className="h-4 w-4" /> Gráfico
              </button>
            </div>
          )}
        </div>
      )}

      {reportsAvailable && report.data && (
        <div className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-3">
          <label className="text-sm font-medium text-neutral-700">Filtro por centro
            <input value={filters.center ?? ''} onChange={(e) => setFilters((f) => ({ ...f, center: e.target.value }))} placeholder="Ej. Centro Habana" className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 font-normal outline-none focus:border-neutral-500" />
          </label>
          <label className="text-sm font-medium text-neutral-700">Filtro por zona
            <input value={filters.zone ?? ''} onChange={(e) => setFilters((f) => ({ ...f, zone: e.target.value }))} placeholder="Ej. Centro" className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 font-normal outline-none focus:border-neutral-500" />
          </label>
          <label className="text-sm font-medium text-neutral-700">Filtro por prioridad
            <input value={filters.priority ?? ''} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))} placeholder="Ej. Urgente" className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 font-normal outline-none focus:border-neutral-500" />
          </label>
          <p className="text-xs text-neutral-500 sm:col-span-3">Filtros de vista frontend; los filtros específicos por endpoint/reportes reales quedan pendientes de backend cuando aplique.</p>
        </div>
      )}

      {reportsPending ? (
        <div role="status" className="rounded-2xl border border-neutral-200 bg-neutral-50 p-10 text-center">
          <p className="font-semibold text-neutral-900">Reportes pendientes de backend</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-600">
            Los seis reportes estarán disponibles cuando el backend exponga{' '}
            <code className="font-mono text-xs">GET /reports/{'{reportId}'}</code>. Mientras tanto
            se mantiene el reporte real de entregas por centro.
          </p>
        </div>
      ) : report.isPending ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
          Generando reporte…
        </div>
      ) : report.isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center text-sm text-rose-700">
          No se pudo cargar el reporte.
        </div>
      ) : report.data ? (
        <div ref={exportRef} className="space-y-6 bg-neutral-50">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <BarChart3 className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-neutral-900">{report.data.title}</h2>
                  <p className="mt-1 text-sm text-neutral-500">{report.data.description}</p>
                </div>
              </div>
              <div className="text-right text-xs text-neutral-500">
                <p>Reporte: {currentOption?.label ?? reportId}</p>
                <p>Vista: {view === 'table' ? 'Tabla' : 'Gráfico'}</p>
              </div>
            </div>
          </section>

          {view === 'chart' ? (
            <section className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-neutral-400">
                Resumen visual
              </p>
              <ReportChart columns={report.data.columns} rows={sortedRows.length ? sortedRows : displayedRows} title={report.data.title} />
              {reportId === 'priority-correlation' && <p className="mt-3 text-xs text-neutral-500">Vista limitada a top 10 registros cuando aplica (frontend).</p>}
            </section>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
                <p className="text-sm text-neutral-500">{(sortedRows.length || displayedRows.length)} filas</p>
                <FileText className="h-5 w-5 text-neutral-400" />
              </div>
              <SortableTable
                key={`${reportId}-${JSON.stringify(filters)}`}
                columns={report.data.columns}
                rows={displayedRows}
                onRowsChange={setSortedRows}
              />
            </section>
          )}
        </div>
      ) : null}
    </div>
  )
}
