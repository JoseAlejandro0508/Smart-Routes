import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Filter, Package, Plus, Search, X } from 'lucide-react'
import { centersApi } from '../api/centers.api'
import { getApiErrorMessage } from '../api/http'
import {
  ordersApi,
  type CreateOrderPayload,
  type DeliveryType,
  type ListOrdersParams,
  type Order,
  type OrderPriority,
  type OrderStatus,
} from '../api/orders.api'
import { StopSelector } from '../components/ui/StopSelector'
import { useAuth } from '../features/auth/AuthProvider'

const typeLabels: Record<DeliveryType, string> = {
  Parcel: 'Paquetería',
  Documents: 'Documentos',
  Perishable: 'Perecederos',
}
const priorityLabels: Record<OrderPriority, string> = { Low: 'Baja', Medium: 'Media', Urgent: 'Urgente' }
const statusLabels: Record<OrderStatus, string> = {
  Pending: 'Pendiente',
  InRoute: 'En ruta',
  Delivered: 'Entregado',
  Returned: 'Devuelto',
}

interface OrderForm {
  description: string
  deliveryType: DeliveryType
  priority: OrderPriority
  weightKg: number
  entryDate: string
  deadlineAt: string
  distributionCenterId: number
  stopId: number
  stopAddress: string
  stopZoneId: number
  stopZoneName: string
}

const initialForm = (): OrderForm => ({
  description: '',
  deliveryType: 'Parcel',
  priority: 'Medium',
  weightKg: 1,
  entryDate: new Date().toISOString().slice(0, 10),
  deadlineAt: '',
  distributionCenterId: 1,
  stopId: 0,
  stopAddress: '',
  stopZoneId: 0,
  stopZoneName: '',
})

function PriorityBadge({ priority }: { priority: OrderPriority }) {
  const tone =
    priority === 'Urgent'
      ? 'bg-rose-50 text-rose-700'
      : priority === 'Medium'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-neutral-100 text-neutral-600'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{priorityLabels[priority]}</span>
}

/** Pantalla del banco de pedidos: listado, filtros, paginación y alta de pedidos. */
export function PedidosPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<ListOrdersParams>({ pageNumber: 1, pageSize: 20 })
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<OrderForm>(initialForm)
  const [formError, setFormError] = useState('')

  const orders = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersApi.list(filters),
  })
  const zones = useQuery({ queryKey: ['zones'], queryFn: centersApi.listZones })

  const createOrder = useMutation({
    mutationFn: (payload: CreateOrderPayload) => ordersApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      setForm(initialForm())
      setFormError('')
      setFormOpen(false)
    },
    onError: (error) => {
      const status = (error as { response?: { status?: number } } | undefined)?.response?.status
      if (status === 409) {
        setFormError('Ya existe un pedido con datos equivalentes en el mismo centro. Revisa la información sin perder lo escrito.')
        return
      }
      setFormError(getApiErrorMessage(error, 'No se pudo registrar el pedido.'))
    },
  })

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return orders.data?.items ?? []
    return (orders.data?.items ?? []).filter((order) =>
      `${order.description} ${order.address} ${order.zoneName}`.toLowerCase().includes(term),
    )
  }, [orders.data?.items, search])

  function updateFilter<K extends keyof ListOrdersParams>(key: K, value: ListOrdersParams[K]) {
    setFilters((current) => ({ ...current, [key]: value, pageNumber: 1 }))
  }

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (
      !form.description.trim() ||
      form.stopId === 0 ||
      !form.deadlineAt ||
      form.weightKg <= 0 ||
      !form.entryDate
    ) {
      setFormError('Completa descripción, parada, peso, fecha de ingreso y fecha límite.')
      return
    }

    const payload: CreateOrderPayload = {
      description: form.description.trim(),
      deliveryType: form.deliveryType,
      priority: form.priority,
      weightKg: form.weightKg,
      entryDate: form.entryDate,
      deadlineAt: form.deadlineAt,
      distributionCenterId: form.distributionCenterId,
      stopId: form.stopId,
    }
    setFormError('')
    createOrder.mutate(payload)
  }

  const totalPages = orders.data ? Math.max(1, Math.ceil(orders.data.totalCount / orders.data.pageSize)) : 1

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-500">Operación</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Banco de pedidos</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Consulta, filtra y registra pedidos para la generación de rutas.
          </p>
        </div>
        {user?.role === 'LogisticsCoordinator' && (
          <button
            type="button"
            onClick={() => setFormOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700"
          >
            {formOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {formOpen ? 'Cerrar formulario' : 'Nuevo pedido'}
          </button>
        )}
      </header>

      {formOpen && (
        <form onSubmit={submitOrder} className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-2">
            <Package className="h-5 w-5 text-neutral-500" />
            <h2 className="font-semibold text-neutral-900">Registrar pedido</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-neutral-700 md:col-span-2">
              Descripción
              <input
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal shadow-sm outline-none focus:border-neutral-500"
                placeholder="Ej. Paquete de repuestos"
              />
            </label>

            <label className="text-sm font-medium text-neutral-700">
              Tipo de entrega
              <select
                value={form.deliveryType}
                onChange={(event) => setForm((current) => ({ ...current, deliveryType: event.target.value as DeliveryType }))}
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 font-normal outline-none focus:border-neutral-500"
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-neutral-700">
              Prioridad
              <select
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as OrderPriority }))}
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 font-normal outline-none focus:border-neutral-500"
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-neutral-700">
              Peso (kg)
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={form.weightKg}
                onChange={(event) => setForm((current) => ({ ...current, weightKg: Number(event.target.value) }))}
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500"
              />
            </label>

            <label className="text-sm font-medium text-neutral-700">
              Fecha de ingreso
              <input
                type="date"
                value={form.entryDate}
                onChange={(event) => setForm((current) => ({ ...current, entryDate: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500"
              />
            </label>

            <label className="text-sm font-medium text-neutral-700">
              Fecha límite
              <input
                type="datetime-local"
                value={form.deadlineAt}
                onChange={(event) => setForm((current) => ({ ...current, deadlineAt: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500"
              />
            </label>

            <label className="text-sm font-medium text-neutral-700">
              Centro de distribución
              <input
                type="number"
                min="1"
                value={form.distributionCenterId}
                onChange={(event) => setForm((current) => ({ ...current, distributionCenterId: Number(event.target.value) }))}
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500"
              />
            </label>

            <div className="text-sm font-medium text-neutral-700 md:col-span-2">
              <label htmlFor="order-stop">Parada</label>
              <StopSelector
                id="order-stop"
                value={{ address: form.stopAddress, zoneId: form.stopZoneId }}
                onChange={(selection, stop) =>
                  setForm((current) => ({
                    ...current,
                    stopId: stop.id,
                    stopAddress: selection.address,
                    stopZoneId: selection.zoneId,
                    stopZoneName: stop.zoneName,
                  }))
                }
              />
              <p className="mt-1 text-xs font-normal text-neutral-500">
                Zona derivada: <span className="font-medium text-neutral-700">{form.stopZoneName || 'Selecciona una parada'}</span>
              </p>
            </div>
          </div>

          {formError && (
            <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={createOrder.isPending}
            className="mt-5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            {createOrder.isPending ? 'Guardando…' : 'Registrar pedido'}
          </button>
        </form>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white">
        <div className="flex flex-wrap gap-3 border-b border-neutral-200 p-4">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Buscar pedidos</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por descripción, zona o dirección"
              className="h-10 w-full rounded-lg border border-neutral-200 pl-9 pr-3 text-sm outline-none focus:border-neutral-500"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <Filter className="h-4 w-4" />
            <select
              value={filters.zoneId ?? ''}
              onChange={(event) => updateFilter('zoneId', event.target.value ? Number(event.target.value) : undefined)}
              className="h-10 rounded-lg border border-neutral-200 bg-white px-3 outline-none focus:border-neutral-500"
            >
              <option value="">Todas las zonas</option>
              {(zones.data ?? []).map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </label>

          <select
            value={filters.deliveryType ?? ''}
            onChange={(event) => updateFilter('deliveryType', (event.target.value || undefined) as DeliveryType | undefined)}
            className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-500"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={filters.priority ?? ''}
            onChange={(event) => updateFilter('priority', (event.target.value || undefined) as OrderPriority | undefined)}
            className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-500"
          >
            <option value="">Todas las prioridades</option>
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={filters.status ?? ''}
            onChange={(event) => updateFilter('status', (event.target.value || undefined) as OrderStatus | undefined)}
            className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-500"
          >
            <option value="">Todos los estados</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {orders.isPending ? (
          <div className="p-8 text-center text-sm text-neutral-500">Cargando pedidos…</div>
        ) : orders.isError ? (
          <div className="p-8 text-center text-sm text-rose-600">No se pudieron cargar los pedidos.</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">No hay pedidos que coincidan con los filtros.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Pedido</th>
                    <th className="px-4 py-3 font-medium">Destino</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Prioridad</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Límite</th>
                    {user?.role === 'LogisticsCoordinator' && <th className="px-4 py-3 text-right font-medium">Clasificación</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredOrders.map((order: Order) => (
                    <tr key={order.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-4">
                        <p className="font-medium text-neutral-900">#{order.id} · {order.description}</p>
                        <p className="mt-1 text-xs text-neutral-500">{order.weightKg} kg · {order.centerName}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-neutral-700">{order.zoneName}</p>
                        <p className="mt-1 text-xs text-neutral-500">{order.address}</p>
                      </td>
                      <td className="px-4 py-4 text-neutral-600">{typeLabels[order.deliveryType]}</td>
                      <td className="px-4 py-4"><PriorityBadge priority={order.priority} /></td>
                      <td className="px-4 py-4 text-neutral-600">{statusLabels[order.status]}</td>
                      <td className="px-4 py-4 text-right text-neutral-600">
                        {new Date(order.deadlineAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      {user?.role === 'LogisticsCoordinator' && (
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            disabled
                            title="Pendiente de endpoint backend de clasificación y validación de propiedad del pedido"
                            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Clasificar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 text-sm text-neutral-600">
              <span>
                {orders.data?.totalCount ?? 0} pedidos · página {orders.data?.pageNumber ?? 1} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={(filters.pageNumber ?? 1) <= 1}
                  onClick={() => setFilters((current) => ({ ...current, pageNumber: (current.pageNumber ?? 1) - 1 }))}
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={(filters.pageNumber ?? 1) >= totalPages}
                  onClick={() => setFilters((current) => ({ ...current, pageNumber: (current.pageNumber ?? 1) + 1 }))}
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
