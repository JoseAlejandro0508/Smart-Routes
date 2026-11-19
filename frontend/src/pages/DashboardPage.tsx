// src/pages/DashboardPage.tsx
// Home de la zona privada: resumen operativo adaptado al rol autenticado.
import { useQuery } from '@tanstack/react-query'
import { Activity, CheckCircle2, ClipboardList, Clock3, RefreshCw } from 'lucide-react'
import { dashboardApi } from '../api/dashboard.api'
import { useAuth } from '../features/auth/AuthProvider'
import { ROLE_LABELS } from '../components/layout/navConfig'

const KPI_ITEMS = [
  { key: 'totalOrders', label: 'Pedidos registrados', icon: ClipboardList, tone: 'bg-blue-50 text-blue-700' },
  { key: 'activeRoutes', label: 'Rutas activas', icon: Activity, tone: 'bg-amber-50 text-amber-700' },
  { key: 'pendingDeliveries', label: 'Entregas pendientes', icon: Clock3, tone: 'bg-rose-50 text-rose-700' },
  { key: 'completedDeliveries', label: 'Entregas completadas', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
] as const

export function DashboardPage() {
  const { user } = useAuth()
  const summary = useQuery({
    queryKey: ['dashboard-summary', user?.id],
    queryFn: dashboardApi.getSummary,
    enabled: Boolean(user),
  })

  const firstName = user?.name.split(' ')[0]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Hola{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Este es tu resumen operativo de Smart Routes.
        </p>
      </header>

      <section aria-label="Indicadores principales" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_ITEMS.map(({ key, label, icon: Icon, tone }) => (
          <div key={key} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-neutral-500">{label}</p>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
            {summary.isPending ? (
              <div className="mt-4 h-9 w-20 animate-pulse rounded-lg bg-neutral-100" />
            ) : summary.isError ? (
              <p className="mt-4 text-sm text-rose-600">No disponible</p>
            ) : (
              <p className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
                {summary.data[key].toLocaleString('es-ES')}
              </p>
            )}
          </div>
        ))}
      </section>

      {summary.isError && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>No se pudieron cargar las métricas del día.</span>
          <button
            type="button"
            onClick={() => summary.refetch()}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium hover:bg-rose-100"
          >
            <RefreshCw className="h-4 w-4" /> Reintentar
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Sesión actual</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">{user?.email}</p>
            {user && <p className="mt-1 text-sm text-neutral-500">{ROLE_LABELS[user.role]}</p>}
          </div>
          {summary.data && (
            <p className="text-xs text-neutral-400">
              Actualizado {new Date(summary.data.generatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
