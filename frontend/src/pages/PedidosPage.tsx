import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Filter, Package, Plus, Search, X } from 'lucide-react'
import { ordersApi, type CreateOrderPayload, type DeliveryType, type OrderPriority, type OrderSummary } from '../api/orders.api'
import { useAuth } from '../features/auth/AuthProvider'

const typeLabels: Record<DeliveryType, string> = { Parcel: 'Paquetería', Documents: 'Documentos', Perishable: 'Perecederos' }
const priorityLabels: Record<OrderPriority, string> = { Low: 'Baja', Medium: 'Media', Urgent: 'Urgente' }
const statusLabels: Record<OrderSummary['status'], string> = { Pending: 'Pendiente', InRoute: 'En ruta', Delivered: 'Entregado', Returned: 'Devuelto' }

const initialForm: CreateOrderPayload = {
  description: '', deliveryType: 'Parcel', priority: 'Medium', weightKg: 1,
  entryDate: new Date().toISOString().slice(0, 10), deadlineAt: '', distributionCenterId: 1,
  stop: { address: '', zoneId: 1 },
}

function PriorityBadge({ priority }: { priority: OrderPriority }) {
  const tone = priority === 'Urgent' ? 'bg-rose-50 text-rose-700' : priority === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-neutral-100 text-neutral-600'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{priorityLabels[priority]}</span>
}

export function PedidosPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState<'all' | OrderPriority>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [formError, setFormError] = useState('')

  const orders = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list })
  const createOrder = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      setForm(initialForm); setFormError(''); setFormOpen(false)
    },
    onError: () => setFormError('No se pudo registrar el pedido. Intenta de nuevo.'),
  })

  const filteredOrders = (orders.data ?? []).filter((order) => {
    const matchesSearch = `${order.description} ${order.address} ${order.zoneName}`.toLowerCase().includes(search.toLowerCase())
    return matchesSearch && (priority === 'all' || order.priority === priority)
  })

  function updateForm<K extends keyof CreateOrderPayload>(field: K, value: CreateOrderPayload[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.description.trim() || !form.stop.address.trim() || !form.deadlineAt || form.weightKg <= 0) {
      setFormError('Completa descripción, dirección, peso y fecha límite.')
      return
    }
    createOrder.mutate(form)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-500">Operación</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Banco de pedidos</h1>
          <p className="mt-1 text-sm text-neutral-500">Consulta, clasifica y prepara pedidos para la generación de rutas.</p>
        </div>
        {user?.role === 'LogisticsCoordinator' && (
          <button type="button" onClick={() => setFormOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700">
            {formOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {formOpen ? 'Cerrar formulario' : 'Nuevo pedido'}
          </button>
        )}
      </header>

      {formOpen && (
        <form onSubmit={submitOrder} className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-2"><Package className="h-5 w-5 text-neutral-500" /><h2 className="font-semibold text-neutral-900">Registrar pedido y parada</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-neutral-700 md:col-span-2">Descripción
              <input value={form.description} onChange={(event) => updateForm('description', event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal shadow-sm outline-none focus:border-neutral-500" placeholder="Ej. Paquete de repuestos" />
            </label>
            <label className="text-sm font-medium text-neutral-700">Tipo de entrega
              <select value={form.deliveryType} onChange={(event) => updateForm('deliveryType', event.target.value as DeliveryType)} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 font-normal outline-none focus:border-neutral-500">{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </label>
            <label className="text-sm font-medium text-neutral-700">Prioridad
              <select value={form.priority} onChange={(event) => updateForm('priority', event.target.value as OrderPriority)} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 font-normal outline-none focus:border-neutral-500">{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </label>
            <label className="text-sm font-medium text-neutral-700">Peso (kg)
              <input type="number" min="0.1" step="0.1" value={form.weightKg} onChange={(event) => updateForm('weightKg', Number(event.target.value))} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />
            </label>
            <label className="text-sm font-medium text-neutral-700">Fecha límite
              <input type="datetime-local" value={form.deadlineAt} onChange={(event) => updateForm('deadlineAt', event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />
            </label>
            <label className="text-sm font-medium text-neutral-700 md:col-span-2">Dirección de la parada
              <input value={form.stop.address} onChange={(event) => setForm((current) => ({ ...current, stop: { ...current.stop, address: event.target.value } }))} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" placeholder="Calle, número y referencias" />
            </label>
            <label className="text-sm font-medium text-neutral-700">Centro de distribución
              <select value={form.distributionCenterId} onChange={(event) => updateForm('distributionCenterId', Number(event.target.value))} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 font-normal outline-none focus:border-neutral-500"><option value="1">Centro Habana</option><option value="2">Centro Vedado</option></select>
            </label>
            <label className="text-sm font-medium text-neutral-700">Zona
              <select value={form.stop.zoneId} onChange={(event) => setForm((current) => ({ ...current, stop: { ...current.stop, zoneId: Number(event.target.value) } }))} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 font-normal outline-none focus:border-neutral-500"><option value="1">Centro</option><option value="2">Vedado</option><option value="3">Plaza</option></select>
            </label>
          </div>
          {formError && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>}
          <button type="submit" disabled={createOrder.isPending} className="mt-5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50">{createOrder.isPending ? 'Guardando…' : 'Registrar pedido'}</button>
        </form>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white">
        <div className="flex flex-wrap gap-3 border-b border-neutral-200 p-4">
          <label className="relative min-w-[220px] flex-1"><span className="sr-only">Buscar pedidos</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por descripción, zona o dirección" className="h-10 w-full rounded-lg border border-neutral-200 pl-9 pr-3 text-sm outline-none focus:border-neutral-500" /></label>
          <label className="flex items-center gap-2 text-sm text-neutral-600"><Filter className="h-4 w-4" /><select value={priority} onChange={(event) => setPriority(event.target.value as 'all' | OrderPriority)} className="h-10 rounded-lg border border-neutral-200 bg-white px-3 outline-none focus:border-neutral-500"><option value="all">Todas las prioridades</option>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>

        {orders.isPending ? <div className="p-8 text-center text-sm text-neutral-500">Cargando pedidos…</div> : orders.isError ? <div className="p-8 text-center text-sm text-rose-600">No se pudieron cargar los pedidos.</div> : filteredOrders.length === 0 ? <div className="p-8 text-center text-sm text-neutral-500">No hay pedidos que coincidan con los filtros.</div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-4 py-3 font-medium">Pedido</th><th className="px-4 py-3 font-medium">Destino</th><th className="px-4 py-3 font-medium">Tipo</th><th className="px-4 py-3 font-medium">Prioridad</th><th className="px-4 py-3 font-medium">Estado</th><th className="px-4 py-3 text-right font-medium">Límite</th></tr></thead><tbody className="divide-y divide-neutral-100">{filteredOrders.map((order) => <tr key={order.id} className="hover:bg-neutral-50"><td className="px-4 py-4"><p className="font-medium text-neutral-900">#{order.id} · {order.description}</p><p className="mt-1 text-xs text-neutral-500">{order.weightKg} kg</p></td><td className="px-4 py-4"><p className="text-neutral-700">{order.zoneName}</p><p className="mt-1 text-xs text-neutral-500">{order.address}</p></td><td className="px-4 py-4 text-neutral-600">{typeLabels[order.deliveryType]}</td><td className="px-4 py-4"><PriorityBadge priority={order.priority} /></td><td className="px-4 py-4 text-neutral-600">{statusLabels[order.status]}</td><td className="px-4 py-4 text-right text-neutral-600">{new Date(order.deadlineAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  )
}