// src/pages/DashboardPage.tsx
// Home de la zona privada (versión clara). El siguiente micropaso le
// añade KPIs reales vía GET /api/dashboard/summary y accesos rápidos.
import { useAuth } from '../features/auth/AuthProvider'
import { ROLE_LABELS } from '../components/layout/navConfig'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Hola{user ? `, ${user.name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Tu centro de control de Smart Routes. Las métricas del día llegan en el próximo micropaso.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Sesión</p>
          <p className="mt-2 text-sm font-medium text-neutral-900">{user?.email}</p>
          {user && (
            <span className="mt-3 inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
              {ROLE_LABELS[user.role]}
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Próximamente</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            KPIs de pedidos, rutas activas y entregas del día, adaptados a tu rol.
          </p>
        </div>
      </section>
    </div>
  )
}
