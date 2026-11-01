import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, RefreshCw, Send } from 'lucide-react'
import { reschedulingsApi, type ManualResolution } from '../api/reschedulings.api'
import { useAuth } from '../features/auth/AuthProvider'

const statusLabels = { Pending: 'Pendiente', InProgress: 'En proceso', Resolved: 'Resuelta' }
const resultLabels: Record<ManualResolution, string> = { Reassigned: 'Reasignado', Rescheduled: 'Reprogramado', ReturnedToWarehouse: 'Devuelto al almacén' }

export function ReschedulingsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [orderId, setOrderId] = useState(1001)
  const [formError, setFormError] = useState('')
  const requests = useQuery({ queryKey: ['reschedulings'], queryFn: reschedulingsApi.list })
  const createRequest = useMutation({
    mutationFn: reschedulingsApi.create,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['reschedulings'] }); setReason(''); setFormError('') },
    onError: () => setFormError('No se pudo enviar la solicitud.'),
  })
  const resolveRequest = useMutation({
    mutationFn: ({ id, result }: { id: number; result: ManualResolution }) => reschedulingsApi.resolve(id, result),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reschedulings'] }),
  })

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reason.trim()) { setFormError('Escribe el motivo de la reprogramación.'); return }
    createRequest.mutate({ routeId: 202, orderId, reason, resolverCoordinatorId: 'usr_01' })
  }

  return (
    <div className="space-y-6">
      <header><p className="text-sm font-medium text-neutral-500">Seguimiento</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Reprogramaciones</h1><p className="mt-1 text-sm text-neutral-500">Solicita o resuelve cambios de entrega dejando trazabilidad.</p></header>
      {user?.role === 'DeliveryPerson' && <form onSubmit={submitRequest} className="rounded-2xl border border-neutral-200 bg-white p-5"><div className="flex items-center gap-2"><Send className="h-5 w-5 text-neutral-500" /><h2 className="font-semibold text-neutral-900">Solicitar reprogramación</h2></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-neutral-700">Pedido<select value={orderId} onChange={(event) => setOrderId(Number(event.target.value))} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 font-normal outline-none focus:border-neutral-500"><option value="1001">#1001 · Paquete de repuestos</option><option value="1003">#1003 · Productos refrigerados</option></select></label><label className="text-sm font-medium text-neutral-700">Coordinador resolutor<input value="Ana Demo · Centro Habana" readOnly className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 font-normal text-neutral-500 outline-none" /></label></div><label className="mt-4 block text-sm font-medium text-neutral-700">Motivo<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Describe por qué necesitas reprogramar la entrega" className="mt-1.5 min-h-24 w-full rounded-lg border border-neutral-200 px-3 py-2 font-normal outline-none focus:border-neutral-500" /></label>{formError && <p role="alert" className="mt-3 text-sm text-rose-600">{formError}</p>}<button type="submit" disabled={createRequest.isPending} className="mt-4 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50">{createRequest.isPending ? 'Enviando…' : 'Enviar solicitud'}</button></form>}
      <section className="rounded-2xl border border-neutral-200 bg-white"><div className="border-b border-neutral-200 p-5"><h2 className="font-semibold text-neutral-900">Solicitudes registradas</h2></div>{requests.isPending ? <p className="p-8 text-center text-sm text-neutral-500">Cargando solicitudes…</p> : requests.data?.length === 0 ? <p className="p-8 text-center text-sm text-neutral-500">No hay solicitudes registradas.</p> : <div className="divide-y divide-neutral-100">{requests.data?.map((request) => <div key={request.id} className="flex flex-wrap items-start justify-between gap-4 p-5"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-neutral-900">#{request.orderId} · {request.orderDescription}</p><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">{statusLabels[request.status]}</span></div><p className="mt-2 text-sm text-neutral-600">{request.reason}</p><p className="mt-1 text-xs text-neutral-500">Coordinador: {request.resolverCoordinatorName}</p>{request.manualResult && <p className="mt-2 text-sm text-emerald-700">Resultado: {resultLabels[request.manualResult]}</p>}</div>{user?.role === 'LogisticsCoordinator' && request.status !== 'Resolved' && <div className="flex flex-wrap gap-2"><button type="button" onClick={() => resolveRequest.mutate({ id: request.id, result: 'Reassigned' })} className="inline-flex items-center gap-1 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-700"><CheckCircle2 className="h-3.5 w-3.5" /> Reasignar</button><button type="button" onClick={() => resolveRequest.mutate({ id: request.id, result: 'Rescheduled' })} className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"><RefreshCw className="mr-1 inline h-3.5 w-3.5" /> Reprogramar</button><button type="button" onClick={() => resolveRequest.mutate({ id: request.id, result: 'ReturnedToWarehouse' })} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Devolver</button></div>}</div>)}</div>}</section>
    </div>
  )
}