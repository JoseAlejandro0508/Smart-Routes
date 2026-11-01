import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CheckCircle2, Clock3, Gauge, MapPinned, Plus, Route as RouteIcon, X } from 'lucide-react'
import { routesApi, type ReviewDecision, type RouteStatus } from '../api/routes.api'
import { useAuth } from '../features/auth/AuthProvider'
import { DeliveryRoutePage } from './DeliveryRoutePage'

const statusLabels: Record<RouteStatus, string> = {
  PendingApproval: 'Pendiente de aprobación', Approved: 'Aprobada', Rejected: 'Rechazada', InModification: 'En modificación',
}
const statusTone: Record<RouteStatus, string> = {
  PendingApproval: 'bg-amber-50 text-amber-700', Approved: 'bg-emerald-50 text-emerald-700', Rejected: 'bg-rose-50 text-rose-700', InModification: 'bg-blue-50 text-blue-700',
}
const today = new Date().toISOString().slice(0, 10)

function StatusBadge({ status }: { status: RouteStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusTone[status]}`}>{statusLabels[status]}</span>
}

export function RutasPage() {
  const { user } = useAuth()
  if (user?.role === 'DeliveryPerson') return <DeliveryRoutePage />
  return <RoutePlanningPage />
}

function RoutePlanningPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [status, setStatus] = useState<'all' | RouteStatus>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [scheduledDate, setScheduledDate] = useState(today)
  const [capacity, setCapacity] = useState(80)
  const [formError, setFormError] = useState('')
  const [reviewObservation, setReviewObservation] = useState('')
  const [reviewError, setReviewError] = useState('')

  const routes = useQuery({ queryKey: ['routes'], queryFn: routesApi.list })
  const generateRoute = useMutation({
    mutationFn: routesApi.generate,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['routes'] })
      setSelectedId(created.id); setFormOpen(false); setFormError('')
    },
    onError: () => setFormError('No se pudo generar la ruta. Intenta de nuevo.'),
  })
  const reviewRoute = useMutation({
    mutationFn: ({ routeId, decision, observations }: { routeId: number; decision: ReviewDecision; observations?: string }) => routesApi.review(routeId, { decision, observations }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['routes'] })
      setReviewObservation(''); setReviewError('')
    },
    onError: () => setReviewError('No se pudo registrar la revisión.'),
  })

  const visibleRoutes = (routes.data ?? []).filter((route) => status === 'all' || route.status === status)
  const selectedRoute = routes.data?.find((route) => route.id === selectedId) ?? visibleRoutes[0]

  function submitGeneration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!scheduledDate || capacity <= 0) {
      setFormError('Indica una fecha y una capacidad mayor que cero.')
      return
    }
    generateRoute.mutate({ scheduledDate, vehicleCapacityKg: capacity, distributionCenterId: 1, orderIds: [1001, 1002, 1003] })
  }

  function submitReview(decision: ReviewDecision) {
    if (!selectedRoute) return
    if (decision === 'Rejected' && !reviewObservation.trim()) {
      setReviewError('Escribe una observación antes de rechazar la ruta.')
      return
    }
    reviewRoute.mutate({ routeId: selectedRoute.id, decision, observations: reviewObservation })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-medium text-neutral-500">Operación</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Rutas de reparto</h1><p className="mt-1 text-sm text-neutral-500">Genera, consulta y prepara rutas para su validación.</p></div>
        {user?.role === 'LogisticsCoordinator' && <button type="button" onClick={() => setFormOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700">{formOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{formOpen ? 'Cerrar formulario' : 'Generar ruta'}</button>}
      </header>

      {formOpen && <form onSubmit={submitGeneration} className="rounded-2xl border border-neutral-200 bg-white p-5"><div className="mb-5 flex items-center gap-2"><RouteIcon className="h-5 w-5 text-neutral-500" /><h2 className="font-semibold text-neutral-900">Generar nueva ruta</h2></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-neutral-700">Fecha programada<input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" /></label><label className="text-sm font-medium text-neutral-700">Capacidad del vehículo (kg)<input type="number" min="1" step="1" value={capacity} onChange={(event) => setCapacity(Number(event.target.value))} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" /></label></div>{formError && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>}<p className="mt-4 text-sm text-neutral-500">Se tomarán los pedidos seleccionados del banco para calcular proporción de tipos, zonas y peso total.</p><button type="submit" disabled={generateRoute.isPending} className="mt-5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50">{generateRoute.isPending ? 'Generando…' : 'Generar ruta'}</button></form>}

      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-neutral-500">{visibleRoutes.length} rutas encontradas</p><label className="flex items-center gap-2 text-sm text-neutral-600"><span>Estado</span><select value={status} onChange={(event) => setStatus(event.target.value as 'all' | RouteStatus)} className="h-10 rounded-lg border border-neutral-200 bg-white px-3 outline-none focus:border-neutral-500"><option value="all">Todos</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>

      {routes.isPending ? <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">Cargando rutas…</div> : routes.isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center text-sm text-rose-700">No se pudieron cargar las rutas.</div> : visibleRoutes.length === 0 ? <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">No hay rutas con este estado.</div> : <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]"><section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-4 py-3 font-medium">Ruta</th><th className="px-4 py-3 font-medium">Centro</th><th className="px-4 py-3 font-medium">Programada</th><th className="px-4 py-3 font-medium">Carga</th><th className="px-4 py-3 font-medium">Estado</th></tr></thead><tbody className="divide-y divide-neutral-100">{visibleRoutes.map((route) => <tr key={route.id} onClick={() => setSelectedId(route.id)} className={`cursor-pointer hover:bg-neutral-50 ${selectedRoute?.id === route.id ? 'bg-neutral-50' : ''}`}><td className="px-4 py-4"><p className="font-medium text-neutral-900">Ruta #{route.id}</p><p className="mt-1 text-xs text-neutral-500">{route.generatorName}</p></td><td className="px-4 py-4 text-neutral-600">{route.centerName}</td><td className="px-4 py-4 text-neutral-600">{new Date(`${route.scheduledDate}T00:00:00`).toLocaleDateString('es-ES')}</td><td className="px-4 py-4 text-neutral-600">{route.orderCount} pedidos · {route.stopCount} paradas</td><td className="px-4 py-4"><StatusBadge status={route.status} /></td></tr>)}</tbody></table></div></section><aside className="rounded-2xl border border-neutral-200 bg-white p-5">{selectedRoute ? <><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Detalle</p><h2 className="mt-1 text-xl font-bold text-neutral-900">Ruta #{selectedRoute.id}</h2></div><StatusBadge status={selectedRoute.status} /></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-neutral-50 p-3"><CalendarDays className="h-4 w-4 text-neutral-500" /><p className="mt-2 text-xs text-neutral-500">Fecha</p><p className="mt-1 text-sm font-medium">{new Date(`${selectedRoute.scheduledDate}T00:00:00`).toLocaleDateString('es-ES')}</p></div><div className="rounded-xl bg-neutral-50 p-3"><Gauge className="h-4 w-4 text-neutral-500" /><p className="mt-2 text-xs text-neutral-500">Capacidad</p><p className="mt-1 text-sm font-medium">{selectedRoute.vehicleCapacityKg} kg</p></div><div className="rounded-xl bg-neutral-50 p-3"><MapPinned className="h-4 w-4 text-neutral-500" /><p className="mt-2 text-xs text-neutral-500">Cobertura</p><p className="mt-1 text-sm font-medium">{selectedRoute.stopCount} paradas</p></div><div className="rounded-xl bg-neutral-50 p-3"><Clock3 className="h-4 w-4 text-neutral-500" /><p className="mt-2 text-xs text-neutral-500">Pedidos</p><p className="mt-1 text-sm font-medium">{selectedRoute.orderCount}</p></div></div><h3 className="mt-6 text-sm font-semibold text-neutral-900">Criterios aplicados</h3><div className="mt-3 space-y-3">{selectedRoute.parameters.map((parameter) => <div key={parameter.label} className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-3 text-sm"><span className="text-neutral-500">{parameter.label}</span><span className="text-right font-medium text-neutral-800">{parameter.value}</span></div>)}</div>{selectedRoute.deliveryPersonName && <p className="mt-5 text-sm text-neutral-500">Repartidor asignado: <span className="font-medium text-neutral-800">{selectedRoute.deliveryPersonName}</span></p>}{user?.role === 'OperationsSupervisor' && selectedRoute.status === 'PendingApproval' && <div className="mt-6 border-t border-neutral-200 pt-5"><h3 className="text-sm font-semibold text-neutral-900">Revisión de la ruta</h3><textarea value={reviewObservation} onChange={(event) => setReviewObservation(event.target.value)} placeholder="Observaciones para la revisión o el rechazo" className="mt-3 min-h-24 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-500" />{reviewError && <p role="alert" className="mt-2 text-sm text-rose-600">{reviewError}</p>}<div className="mt-3 flex gap-2"><button type="button" disabled={reviewRoute.isPending} onClick={() => submitReview('Approved')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Aprobar</button><button type="button" disabled={reviewRoute.isPending} onClick={() => submitReview('Rejected')} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Rechazar</button></div></div>}</> : <div className="flex min-h-60 flex-col items-center justify-center text-center text-sm text-neutral-500"><CheckCircle2 className="h-8 w-8 text-neutral-300" /><p className="mt-3">Selecciona una ruta para ver su detalle.</p></div>}</aside></div>}
    </div>
  )
}