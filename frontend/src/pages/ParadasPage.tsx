import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Filter, MapPin, Pencil, Plus, X } from 'lucide-react'
import { ZONES, stopsApi, type Stop, type StopPayload } from '../api/stops.api'

const emptyForm: StopPayload = { address: '', zoneId: 1 }

/** Pantalla de gestión de paradas: listado, filtro por zona y alta/edición. */
export function ParadasPage() {
  const queryClient = useQueryClient()
  const stops = useQuery({ queryKey: ['stops'], queryFn: stopsApi.list })

  const [zoneFilter, setZoneFilter] = useState<'all' | number>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Stop | null>(null)
  const [form, setForm] = useState<StopPayload>(emptyForm)
  const [formError, setFormError] = useState('')

  const saveStop = useMutation({
    mutationFn: async (payload: StopPayload) =>
      editing ? stopsApi.update(editing.id, payload) : stopsApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stops'] })
      closeForm()
    },
    onError: () => setFormError('No se pudo guardar la parada. Intenta de nuevo.'),
  })

  const filteredStops = useMemo(
    () =>
      (stops.data ?? []).filter((stop) => zoneFilter === 'all' || stop.zoneId === zoneFilter),
    [stops.data, zoneFilter],
  )

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(stop: Stop) {
    setEditing(stop)
    setForm({ address: stop.address, zoneId: stop.zoneId })
    setFormError('')
    setFormOpen(true)
  }

  function closeForm() {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setFormOpen(false)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.address.trim()) {
      setFormError('La dirección es obligatoria.')
      return
    }
    setFormError('')
    saveStop.mutate({ address: form.address.trim(), zoneId: form.zoneId })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-500">Operación</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Paradas</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Registra y edita las paradas disponibles para asignarlas a los pedidos.
          </p>
        </div>
        <button
          type="button"
          onClick={formOpen && !editing ? closeForm : openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          {formOpen && !editing ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {formOpen && !editing ? 'Cerrar formulario' : 'Nueva parada'}
        </button>
      </header>

      {formOpen && (
        <form onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-neutral-500" />
            <h2 className="font-semibold text-neutral-900">
              {editing ? `Editar parada #${editing.id}` : 'Registrar parada'}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-neutral-700 md:col-span-2">
              Dirección
              <input
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal shadow-sm outline-none focus:border-neutral-500"
                placeholder="Calle, número y referencias"
              />
            </label>
            <label className="text-sm font-medium text-neutral-700">
              Zona
              <select
                value={form.zoneId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, zoneId: Number(event.target.value) }))
                }
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 font-normal outline-none focus:border-neutral-500"
              >
                {ZONES.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {formError && (
            <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          )}
          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={saveStop.isPending}
              className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {saveStop.isPending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Registrar parada'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white">
        <div className="flex flex-wrap gap-3 border-b border-neutral-200 p-4">
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filtrar por zona</span>
            <select
              value={zoneFilter}
              onChange={(event) =>
                setZoneFilter(event.target.value === 'all' ? 'all' : Number(event.target.value))
              }
              className="h-10 rounded-lg border border-neutral-200 bg-white px-3 outline-none focus:border-neutral-500"
            >
              <option value="all">Todas las zonas</option>
              {ZONES.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {stops.isPending ? (
          <div className="p-8 text-center text-sm text-neutral-500">Cargando paradas…</div>
        ) : stops.isError ? (
          <div className="p-8 text-center text-sm text-rose-600">No se pudieron cargar las paradas.</div>
        ) : filteredStops.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            No hay paradas que coincidan con el filtro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Parada</th>
                  <th className="px-4 py-3 font-medium">Zona</th>
                  <th className="px-4 py-3 font-medium">Dirección</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredStops.map((stop) => (
                  <tr key={stop.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-4 font-medium text-neutral-900">#{stop.id}</td>
                    <td className="px-4 py-4 text-neutral-700">{stop.zoneName}</td>
                    <td className="px-4 py-4 text-neutral-600">{stop.address}</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(stop)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
