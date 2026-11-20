import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CheckCircle2, Gauge, MapPinned, Package, Plus, Route as RouteIcon, User, X } from 'lucide-react'
import { adminApi } from '../api/admin.api'
import { balanceCriteriaApi } from '../api/balance-criteria.api'
import { centersApi } from '../api/centers.api'
import { getApiErrorMessage } from '../api/http'
import {
  routesApi,
  type AddReviewPayload,
  type GenerateRoutePayload,
  type Route,
} from '../api/routes.api'
import { useAuth } from '../features/auth/AuthProvider'
import { DeliveryRoutePage } from './DeliveryRoutePage'

type ViewState = 'Pending' | 'Approved' | 'Rejected' | 'all'

const stateLabels: Record<Exclude<ViewState, 'all'>, string> = {
  Pending: 'Pendiente de aprobación',
  Approved: 'Aprobada',
  Rejected: 'Rechazada',
}

const stateTone: Record<Exclude<ViewState, 'all'>, string> = {
  Pending: 'bg-amber-50 text-amber-700',
  Approved: 'bg-emerald-50 text-emerald-700',
  Rejected: 'bg-rose-50 text-rose-700',
}

function StatusBadge({ state }: { state: Exclude<ViewState, 'all'> }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${stateTone[state]}`}>{stateLabels[state]}</span>
}

function formatDate(value: string) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Pantalla de rutas: planificación/revisión o vista de reparto según el rol. */
export function RutasPage() {
  const { user } = useAuth()
  if (user?.role === 'DeliveryPerson') return <DeliveryRoutePage />
  return <RoutePlanningPage />
}

function RoutePlanningPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [stateFilter, setStateFilter] = useState<ViewState>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [generatePayload, setGeneratePayload] = useState<GenerateRoutePayload>({
    scheduledDate: new Date().toISOString().slice(0, 16),
    deliveryPersonId: '',
    distributionCenterId: 0,
    balanceCriterionId: 0,
  })

  const [reviewObservation, setReviewObservation] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reconfigCriterionId, setReconfigCriterionId] = useState<number | ''>('')

  const routeQueryKey = ['routes', stateFilter]
  const routes = useQuery({
    queryKey: routeQueryKey,
    queryFn: () => routesApi.list(stateFilter === 'all' ? {} : { state: stateFilter }),
  })

  const list = routes.data ?? []
  const selectedRoute: Route | undefined = list.find((route) => route.id === selectedId) ?? list[0]
  const routeMap = useQuery({
    queryKey: ['route-map', selectedRoute?.id],
    queryFn: () => routesApi.getMap(selectedRoute!.id),
    enabled: Boolean(selectedRoute?.id),
  })

  const centers = useQuery({ queryKey: ['centers'], queryFn: centersApi.list })
  const criteria = useQuery({ queryKey: ['balance-criteria'], queryFn: balanceCriteriaApi.list })
  const deliveryPersons = useQuery({
    queryKey: ['delivery-persons'],
    queryFn: adminApi.listDeliveryPersons,
    enabled: user?.role === 'LogisticsCoordinator' || user?.role === 'Administrator',
  })

  const generateRoute = useMutation({
    mutationFn: routesApi.generate,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['routes'] })
      setSelectedId(created.routeId)
      setFormOpen(false)
      setFormError('')
    },
    onError: (error) => setFormError(getApiErrorMessage(error, 'No se pudo generar la ruta.')),
  })

  const addReview = useMutation({
    mutationFn: (payload: AddReviewPayload) => routesApi.addReview(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['routes'] })
      setReviewObservation('')
      setReviewError('')
      setReconfigCriterionId('')
    },
    onError: (error) => setReviewError(getApiErrorMessage(error, 'No se pudo registrar la revisión.')),
  })

  const selectedState: Exclude<ViewState, 'all'> = stateFilter === 'all' ? 'Pending' : stateFilter

  const selectedCriterion = useMemo(
    () => (criteria.data ?? []).find((criterion) => criterion.id === generatePayload.balanceCriterionId),
    [criteria.data, generatePayload.balanceCriterionId],
  )

  function submitGeneration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!generatePayload.scheduledDate || !generatePayload.deliveryPersonId || !generatePayload.distributionCenterId || !generatePayload.balanceCriterionId) {
      setFormError('Selecciona fecha, centro, repartidor y criterio de equilibrio.')
      return
    }
    setFormError('')
    generateRoute.mutate(generatePayload)
  }

  function submitReview(decision: 'Approved' | 'Rejected') {
    if (!selectedRoute) return
    if (decision === 'Rejected' && !reviewObservation.trim()) {
      setReviewError('Escribe una observación antes de rechazar la ruta.')
      return
    }
    addReview.mutate({
      routeId: selectedRoute.id,
      decision,
      observations: reviewObservation.trim() || undefined,
      ...(decision === 'Rejected' && reconfigCriterionId ? { newBalanceCriterionId: Number(reconfigCriterionId) } : {}),
    })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-500">Operación</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Rutas de reparto</h1>
          <p className="mt-1 text-sm text-neutral-500">Genera, consulta y revisa rutas con datos reales del backend.</p>
        </div>
        {(user?.role === 'LogisticsCoordinator' || user?.role === 'Administrator') && (
          <button
            type="button"
            onClick={() => setFormOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700"
          >
            {formOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {formOpen ? 'Cerrar formulario' : 'Generar ruta'}
          </button>
        )}
      </header>

      {formOpen && (
        <form onSubmit={submitGeneration} className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-2"><RouteIcon className="h-5 w-5 text-neutral-500" /><h2 className="font-semibold text-neutral-900">Generar nueva ruta</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-neutral-700">Fecha programada
              <input type="datetime-local" value={generatePayload.scheduledDate} onChange={(e) => setGeneratePayload((p) => ({ ...p, scheduledDate: e.target.value }))} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />
            </label>
            <label className="text-sm font-medium text-neutral-700">Centro de distribución
              <select value={generatePayload.distributionCenterId || ''} onChange={(e) => setGeneratePayload((p) => ({ ...p, distributionCenterId: Number(e.target.value) }))} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 font-normal outline-none focus:border-neutral-500">
                <option value="">Selecciona un centro</option>
                {(centers.data ?? []).map((center) => <option key={center.id} value={center.id}>{center.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-neutral-700">Repartidor
              <select value={generatePayload.deliveryPersonId} onChange={(e) => setGeneratePayload((p) => ({ ...p, deliveryPersonId: e.target.value }))} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 font-normal outline-none focus:border-neutral-500">
                <option value="">Selecciona un repartidor</option>
                {(deliveryPersons.data ?? []).map((person) => <option key={person.id} value={person.id}>{person.name} ({person.email})</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-neutral-700">Criterio de equilibrio
              <select value={generatePayload.balanceCriterionId || ''} onChange={(e) => setGeneratePayload((p) => ({ ...p, balanceCriterionId: Number(e.target.value) }))} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 font-normal outline-none focus:border-neutral-500">
                <option value="">Selecciona un criterio</option>
                {(criteria.data ?? []).map((criterion) => <option key={criterion.id} value={criterion.id}>{criterion.name}</option>)}
              </select>
            </label>
          </div>

          {selectedCriterion && (
            <div className="mt-4 rounded-xl bg-neutral-50 p-4">
              <h3 className="text-sm font-semibold text-neutral-900">Parámetros del criterio seleccionado</h3>
              <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                {selectedCriterion.parameters.map((param) => (
                  <li key={param.id}>• {param.name}: {param.metric} {param.operator} {param.appliedValue}{param.targetDeliveryType ? ` (${param.targetDeliveryType})` : ''}</li>
                ))}
              </ul>
            </div>
          )}

          {formError && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>}
          <button type="submit" disabled={generateRoute.isPending} className="mt-5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50">{generateRoute.isPending ? 'Generando…' : 'Generar ruta'}</button>
        </form>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">{list.length} rutas encontradas</p>
        <label className="flex items-center gap-2 text-sm text-neutral-600"><span>Estado</span>
          <select value={stateFilter} onChange={(e) => { setStateFilter(e.target.value as ViewState); setSelectedId(null) }} className="h-10 rounded-lg border border-neutral-200 bg-white px-3 outline-none focus:border-neutral-500">
            <option value="all">Todos</option>
            {Object.entries(stateLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      {routes.isPending ? <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">Cargando rutas…</div> : routes.isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center text-sm text-rose-700">No se pudieron cargar las rutas.</div> : list.length === 0 ? <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">No hay rutas para este filtro.</div> : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-4 py-3 font-medium">Ruta</th><th className="px-4 py-3 font-medium">Centro</th><th className="px-4 py-3 font-medium">Programada</th><th className="px-4 py-3 font-medium">Carga</th><th className="px-4 py-3 font-medium">Estado</th></tr></thead>
                <tbody className="divide-y divide-neutral-100">
                  {list.map((route) => (
                    <tr key={route.id} onClick={() => setSelectedId(route.id)} className={`cursor-pointer hover:bg-neutral-50 ${selectedRoute?.id === route.id ? 'bg-neutral-50' : ''}`}>
                      <td className="px-4 py-4"><p className="font-medium text-neutral-900">Ruta #{route.id}</p><p className="mt-1 text-xs text-neutral-500">Coord. {route.generatorCoordinatorId.slice(0, 8)}</p></td>
                      <td className="px-4 py-4 text-neutral-600">Centro #{route.distributionCenterId}</td>
                      <td className="px-4 py-4 text-neutral-600">{formatDate(route.scheduledDate)}</td>
                      <td className="px-4 py-4 text-neutral-600">{route.ordersOrdered?.length ?? 0} pedidos</td>
                      <td className="px-4 py-4"><StatusBadge state={selectedState} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="rounded-2xl border border-neutral-200 bg-white p-5">
            {selectedRoute ? (
              <>
                <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Detalle</p><h2 className="mt-1 text-xl font-bold text-neutral-900">Ruta #{selectedRoute.id}</h2></div><StatusBadge state={selectedState} /></div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-neutral-50 p-3"><CalendarDays className="h-4 w-4 text-neutral-500" /><p className="mt-2 text-xs text-neutral-500">Programada</p><p className="mt-1 text-sm font-medium">{formatDate(selectedRoute.scheduledDate)}</p></div>
                  <div className="rounded-xl bg-neutral-50 p-3"><User className="h-4 w-4 text-neutral-500" /><p className="mt-2 text-xs text-neutral-500">Repartidor</p><p className="mt-1 text-sm font-medium break-all">{selectedRoute.deliveryPersonId || 'Sin asignar'}</p></div>
                  <div className="rounded-xl bg-neutral-50 p-3"><MapPinned className="h-4 w-4 text-neutral-500" /><p className="mt-2 text-xs text-neutral-500">Centro</p><p className="mt-1 text-sm font-medium">#{selectedRoute.distributionCenterId}</p></div>
                  <div className="rounded-xl bg-neutral-50 p-3"><Package className="h-4 w-4 text-neutral-500" /><p className="mt-2 text-xs text-neutral-500">Pedidos</p><p className="mt-1 text-sm font-medium">{selectedRoute.ordersOrdered?.length ?? 0}</p></div>
                </div>

                <h3 className="mt-6 text-sm font-semibold text-neutral-900">Criterio y parámetros</h3>
                {selectedRoute.balanceCriterion ? (
                  <div className="mt-2 space-y-2 text-sm">
                    <p className="font-medium text-neutral-800">{selectedRoute.balanceCriterion.name}</p>
                    {selectedRoute.balanceCriterion.parameters.map((param) => (
                      <div key={param.id} className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-2 text-neutral-600"><span>{param.name} ({param.metric})</span><span className="text-right font-medium text-neutral-800">{param.operator} {param.appliedValue}{param.targetDeliveryType ? ` · ${param.targetDeliveryType}` : ''}</span></div>
                    ))}
                  </div>
                ) : <p className="mt-2 text-sm text-neutral-500">Criterio #{selectedRoute.balanceCriterionId}</p>}

                <h3 className="mt-6 text-sm font-semibold text-neutral-900">Itinerario (pedidos en orden)</h3>
                <div className="mt-2 space-y-2">
                  {(selectedRoute.ordersOrdered ?? []).length === 0 ? <p className="text-sm text-neutral-500">Sin pedidos en la ruta.</p> : selectedRoute.ordersOrdered.map((order, index) => (
                    <div key={order.id} className="rounded-lg border border-neutral-200 p-3 text-sm">
                      <p className="font-medium text-neutral-900">{index + 1}. #{order.id} · {order.description}</p>
                      <p className="mt-1 text-neutral-500">{order.stopAddress} · {order.deliveryType} · {order.priority} · {order.weightKg} kg</p>
                    </div>
                  ))}
                </div>

                <h3 className="mt-6 text-sm font-semibold text-neutral-900">Mapa y recorrido</h3>
                {routeMap.isPending ? (
                  <p className="mt-2 text-sm text-neutral-500">Cargando mapa de la ruta…</p>
                ) : routeMap.isError ? (
                  <p className="mt-2 text-sm text-neutral-500">Mapa no disponible (pendiente de datos/endpoint backend o sin geometría).</p>
                ) : routeMap.data ? (
                  <div className="mt-2 space-y-2 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-700">
                    <p><span className="font-medium">Centro:</span> {routeMap.data.center.name}</p>
                    <p><span className="font-medium">Paradas:</span> {routeMap.data.stops.length}</p>
                    {routeMap.data.path ? <p><span className="font-medium">Recorrido:</span> {Math.round(routeMap.data.path.distanceMeters)} m · {Math.round(routeMap.data.path.durationSeconds / 60)} min</p> : <p className="text-neutral-500">Sin geometría de ruta disponible.</p>}
                    {routeMap.data.stops.slice(0, 5).map((stop) => <p key={stop.stopId} className="text-xs text-neutral-500">#{stop.visitOrder} {stop.address} {stop.latitude != null && stop.longitude != null ? `(${stop.latitude}, ${stop.longitude})` : ''}</p>)}
                    {routeMap.data.stops.length > 5 && <p className="text-xs text-neutral-500">… y {routeMap.data.stops.length - 5} paradas más.</p>}
                    <p className="text-xs text-neutral-500">Visualización cartográfica completa pendiente de integración de mapa (frontend/backend según datos disponibles).</p>
                  </div>
                ) : null}

                {user?.role === 'OperationsSupervisor' && (stateFilter === 'Pending' || selectedState === 'Pending') && (
                  <div className="mt-6 border-t border-neutral-200 pt-5">
                    <h3 className="text-sm font-semibold text-neutral-900">Revisión de la ruta</h3>
                    <textarea value={reviewObservation} onChange={(e) => setReviewObservation(e.target.value)} placeholder="Observaciones para la revisión o el rechazo" className="mt-3 min-h-24 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-500" />
                    <label className="mt-3 block text-sm text-neutral-700">Criterio para re-confección (opcional al rechazar)
                      <select value={reconfigCriterionId} onChange={(e) => setReconfigCriterionId(e.target.value ? Number(e.target.value) : '')} className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-500">
                        <option value="">Ninguno</option>
                        {(criteria.data ?? []).map((criterion) => <option key={criterion.id} value={criterion.id}>{criterion.name}</option>)}
                      </select>
                    </label>
                    {reviewError && <p role="alert" className="mt-2 text-sm text-rose-600">{reviewError}</p>}
                    <div className="mt-3 flex gap-2">
                      <button type="button" disabled={addReview.isPending} onClick={() => submitReview('Approved')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Aprobar</button>
                      <button type="button" disabled={addReview.isPending} onClick={() => submitReview('Rejected')} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Rechazar</button>
                    </div>
                  </div>
                )}
              </>
            ) : <div className="flex min-h-60 flex-col items-center justify-center text-center text-sm text-neutral-500"><Gauge className="h-8 w-8 text-neutral-300" /><p className="mt-3">Selecciona una ruta para ver su detalle.</p></div>}
          </aside>
        </div>
      )}
    </div>
  )
}
