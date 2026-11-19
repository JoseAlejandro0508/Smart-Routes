import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, CircleAlert, MapPin, PackageCheck, Truck } from 'lucide-react'
import { deliveriesApi, type AssignedStop, type DeliveryResult } from '../api/deliveries.api'

const resultLabels: Record<DeliveryResult, string> = { Pending: 'Pendiente', Successful: 'Entregada', Failed: 'Fallida' }
const priorityLabels = { Low: 'Baja', Medium: 'Media', Urgent: 'Urgente' }

function ResultBadge({ result }: { result: DeliveryResult }) {
  const tone = result === 'Successful' ? 'bg-emerald-50 text-emerald-700' : result === 'Failed' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{resultLabels[result]}</span>
}

export function DeliveryRoutePage() {
  const queryClient = useQueryClient()
  const [activeStop, setActiveStop] = useState<{ routeId: number; stop: AssignedStop } | null>(null)
  const [observations, setObservations] = useState('')
  const [error, setError] = useState('')
  const assignedRoutes = useQuery({ queryKey: ['assigned-routes'], queryFn: deliveriesApi.listAssignedRoutes })
  const recordDelivery = useMutation({
    mutationFn: ({ routeId, orderId, result }: { routeId: number; orderId: number; result: Exclude<DeliveryResult, 'Pending'> }) => deliveriesApi.record(routeId, orderId, { result, observations }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assigned-routes'] })
      setActiveStop(null); setObservations(''); setError('')
    },
    onError: () => setError('No se pudo registrar la entrega. Revisa las observaciones.'),
  })

  function submitResult(routeId: number, stop: AssignedStop, result: Exclude<DeliveryResult, 'Pending'>) {
    if (result === 'Failed' && !observations.trim()) {
      setError('Indica el motivo de la entrega fallida.')
      return
    }
    recordDelivery.mutate({ routeId, orderId: stop.orderId, result })
  }

  const stops = assignedRoutes.data?.flatMap((route) => route.stops) ?? []
  const completed = stops.filter((stop) => stop.result === 'Successful').length
  const pending = stops.filter((stop) => stop.result === 'Pending').length

  return (
    <div className="space-y-6">
      <header><p className="text-sm font-medium text-neutral-500">Mi operación</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Mis rutas</h1><p className="mt-1 text-sm text-neutral-500">Registra el resultado de cada parada al completar tu jornada.</p></header>
      {assignedRoutes.isPending ? <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">Cargando rutas asignadas…</div> : assignedRoutes.isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center text-sm text-rose-700">No se pudieron cargar tus rutas.</div> : assignedRoutes.data?.length === 0 ? <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">No tienes rutas asignadas.</div> : <>
        <section className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-neutral-200 bg-white p-5"><Truck className="h-5 w-5 text-neutral-500" /><p className="mt-3 text-sm text-neutral-500">Rutas asignadas</p><p className="mt-1 text-3xl font-semibold">{assignedRoutes.data?.length}</p></div><div className="rounded-2xl border border-neutral-200 bg-white p-5"><PackageCheck className="h-5 w-5 text-emerald-600" /><p className="mt-3 text-sm text-neutral-500">Entregas completadas</p><p className="mt-1 text-3xl font-semibold">{completed}</p></div><div className="rounded-2xl border border-neutral-200 bg-white p-5"><CircleAlert className="h-5 w-5 text-amber-600" /><p className="mt-3 text-sm text-neutral-500">Pendientes</p><p className="mt-1 text-3xl font-semibold">{pending}</p></div></section>
        {assignedRoutes.data?.map((route) => <section key={route.routeId} className="rounded-2xl border border-neutral-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 p-5"><div><h2 className="font-semibold text-neutral-900">Ruta #{route.routeId}</h2><p className="mt-1 text-sm text-neutral-500">{route.centerName} · {new Date(`${route.scheduledDate}T00:00:00`).toLocaleDateString('es-ES')}</p></div><span className="text-sm text-neutral-500">{route.stops.length} paradas</span></div><div className="divide-y divide-neutral-100">{route.stops.map((stop, index) => <div key={stop.orderId} className="p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-600">{index + 1}</span><div><p className="font-medium text-neutral-900">{stop.description}</p><p className="mt-1 flex items-center gap-1 text-sm text-neutral-500"><MapPin className="h-4 w-4" />{stop.address} · {stop.zoneName}</p><p className="mt-2 text-xs text-neutral-500">Prioridad: {priorityLabels[stop.priority]}</p></div></div><ResultBadge result={stop.result} /></div>{stop.observations && <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600">{stop.observations}</p>}{stop.result === 'Pending' && <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => submitResult(route.routeId, stop, 'Successful')} disabled={recordDelivery.isPending} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Entrega completada</button><button type="button" onClick={() => { setActiveStop({ routeId: route.routeId, stop }); setError('') }} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Registrar incidencia</button></div>}</div>)}</div></section>)}
      </>}
      {activeStop && <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"><h2 className="text-lg font-semibold text-neutral-900">Registrar incidencia</h2><p className="mt-1 text-sm text-neutral-500">{activeStop.stop.description}</p><textarea value={observations} onChange={(event) => setObservations(event.target.value)} placeholder="Describe el motivo de la entrega fallida" className="mt-4 min-h-28 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-500" />{error && <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p>}<div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => { setActiveStop(null); setObservations(''); setError('') }} className="rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100">Cancelar</button><button type="button" disabled={recordDelivery.isPending} onClick={() => submitResult(activeStop.routeId, activeStop.stop, 'Failed')} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">Guardar incidencia</button></div></div></div>}
    </div>
  )
}