// src/pages/CentrosPage.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, MapPinned, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { centersApi, type CenterPayload, type DistributionCenter, type Zone } from '../api/centers.api'
import { getApiErrorMessage } from '../api/http'
import { centerSchema, zoneSchema, type CenterValues, type ZoneValues } from '../features/centers/schemas'

const emptyCenter: CenterValues = {
  name: '',
  logisticsProgram: '',
  latitude: undefined,
  longitude: undefined,
  coveredZoneIds: [],
}

/** Pantalla administrativa de centros de distribución, zonas y cobertura. */
export function CentrosPage() {
  const queryClient = useQueryClient()
  const [centerFormOpen, setCenterFormOpen] = useState(false)
  const [editingCenter, setEditingCenter] = useState<DistributionCenter | null>(null)
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [actionError, setActionError] = useState('')

  const centers = useQuery({ queryKey: ['centers'], queryFn: centersApi.list })
  const zones = useQuery({ queryKey: ['zones'], queryFn: centersApi.listZones })

  const centerForm = useForm<CenterValues>({
    resolver: zodResolver(centerSchema),
    defaultValues: emptyCenter,
  })
  const zoneForm = useForm<ZoneValues>({
    resolver: zodResolver(zoneSchema),
    defaultValues: { name: '' },
  })

  const saveCenter = useMutation({
    mutationFn: async (values: CenterValues) => {
      const payload: CenterPayload = {
        name: values.name,
        logisticsProgram: values.logisticsProgram,
        latitude: values.latitude,
        longitude: values.longitude,
        coveredZoneIds: values.coveredZoneIds,
      }
      if (editingCenter) {
        await centersApi.update(editingCenter.id, payload)
      } else {
        await centersApi.create(payload)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['centers'] })
      closeCenterForm()
    },
    onError: (error) => setActionError(getApiErrorMessage(error, 'No se pudo guardar el centro.')),
  })

  const deleteCenter = useMutation({
    mutationFn: centersApi.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['centers'] })
    },
    onError: (error) => setActionError(getApiErrorMessage(error, 'No se pudo eliminar el centro.')),
  })

  const saveZone = useMutation({
    mutationFn: async (values: ZoneValues) => {
      if (editingZone) {
        await centersApi.updateZone(editingZone.id, values)
      } else {
        await centersApi.createZone(values)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['zones'] })
      setEditingZone(null)
      zoneForm.reset({ name: '' })
    },
    onError: (error) => setActionError(getApiErrorMessage(error, 'No se pudo guardar la zona.')),
  })

  const deleteZone = useMutation({
    mutationFn: centersApi.removeZone,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['zones'] })
    },
    onError: (error) => setActionError(getApiErrorMessage(error, 'No se pudo eliminar la zona.')),
  })

  const selectedZoneIds = centerForm.watch('coveredZoneIds')

  function openCreateCenter() {
    setEditingCenter(null)
    setActionError('')
    centerForm.reset(emptyCenter)
    setCenterFormOpen(true)
  }

  function openEditCenter(center: DistributionCenter) {
    setEditingCenter(center)
    setActionError('')
    centerForm.reset({
      name: center.name,
      logisticsProgram: center.logisticsProgram,
      latitude: center.latitude ?? undefined,
      longitude: center.longitude ?? undefined,
      coveredZoneIds: center.coveredZoneIds,
    })
    setCenterFormOpen(true)
  }

  function closeCenterForm() {
    setEditingCenter(null)
    setCenterFormOpen(false)
    setActionError('')
    centerForm.reset(emptyCenter)
  }

  function toggleZone(zoneId: number) {
    const next = selectedZoneIds.includes(zoneId)
      ? selectedZoneIds.filter((id) => id !== zoneId)
      : [...selectedZoneIds, zoneId]
    centerForm.setValue('coveredZoneIds', next, { shouldValidate: true })
  }

  function startEditZone(zone: Zone) {
    setEditingZone(zone)
    setActionError('')
    zoneForm.reset({ name: zone.name })
  }

  function zoneName(zoneId: number) {
    return zones.data?.find((zone) => zone.id === zoneId)?.name ?? `Zona #${zoneId}`
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-500">Administración</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Centros y zonas</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Administra la infraestructura logística y la cobertura de cada centro.
          </p>
        </div>
        <button
          type="button"
          onClick={centerFormOpen ? closeCenterForm : openCreateCenter}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          {centerFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {centerFormOpen ? 'Cerrar formulario' : 'Nuevo centro'}
        </button>
      </header>

      {actionError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </p>
      )}

      {centerFormOpen && (
        <form
          onSubmit={centerForm.handleSubmit((values) => saveCenter.mutate(values))}
          className="rounded-2xl border border-neutral-200 bg-white p-5"
        >
          <div className="mb-5 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-neutral-500" />
            <h2 className="font-semibold text-neutral-900">
              {editingCenter ? `Editar ${editingCenter.name}` : 'Registrar centro'}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-neutral-700">
              Nombre
              <input
                {...centerForm.register('name')}
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal shadow-sm outline-none focus:border-neutral-500"
                placeholder="Centro Habana"
              />
              {centerForm.formState.errors.name && (
                <span className="mt-1 block text-xs text-rose-600">{centerForm.formState.errors.name.message}</span>
              )}
            </label>

            <label className="text-sm font-medium text-neutral-700">
              Programa logístico
              <input
                {...centerForm.register('logisticsProgram')}
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal shadow-sm outline-none focus:border-neutral-500"
                placeholder="Programa urbano"
              />
              {centerForm.formState.errors.logisticsProgram && (
                <span className="mt-1 block text-xs text-rose-600">
                  {centerForm.formState.errors.logisticsProgram.message}
                </span>
              )}
            </label>

            <label className="text-sm font-medium text-neutral-700">
              Latitud
              <input
                type="number"
                step="any"
                {...centerForm.register('latitude', {
                  setValueAs: (value) => (value === '' || value === null ? undefined : Number(value)),
                })}
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal shadow-sm outline-none focus:border-neutral-500"
                placeholder="23.132"
              />
              {centerForm.formState.errors.latitude && (
                <span className="mt-1 block text-xs text-rose-600">{centerForm.formState.errors.latitude.message}</span>
              )}
            </label>

            <label className="text-sm font-medium text-neutral-700">
              Longitud
              <input
                type="number"
                step="any"
                {...centerForm.register('longitude', { valueAsNumber: true })}
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal shadow-sm outline-none focus:border-neutral-500"
                placeholder="-82.374"
              />
              {centerForm.formState.errors.longitude && (
                <span className="mt-1 block text-xs text-rose-600">{centerForm.formState.errors.longitude.message}</span>
              )}
            </label>
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-neutral-700">Zonas cubiertas</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(zones.data ?? []).map((zone) => (
                <label
                  key={zone.id}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                    selectedZoneIds.includes(zone.id)
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white text-neutral-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedZoneIds.includes(zone.id)}
                    onChange={() => toggleZone(zone.id)}
                  />
                  {zone.name}
                </label>
              ))}
            </div>
            {centerForm.formState.errors.coveredZoneIds && (
              <p className="mt-1 text-xs text-rose-600">{centerForm.formState.errors.coveredZoneIds.message}</p>
            )}
          </fieldset>

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={saveCenter.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saveCenter.isPending ? 'Guardando…' : editingCenter ? 'Guardar cambios' : 'Registrar centro'}
            </button>
            <button
              type="button"
              onClick={closeCenterForm}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-4">
            <Building2 className="h-5 w-5 text-neutral-500" />
            <h2 className="font-semibold text-neutral-900">Centros de distribución</h2>
          </div>

          {centers.isPending ? (
            <p className="p-8 text-center text-sm text-neutral-500">Cargando centros…</p>
          ) : centers.isError ? (
            <p className="p-8 text-center text-sm text-rose-600">No se pudieron cargar los centros.</p>
          ) : (centers.data ?? []).length === 0 ? (
            <p className="p-8 text-center text-sm text-neutral-500">Aún no hay centros registrados.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {(centers.data ?? []).map((center) => (
                <article key={center.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-neutral-900">{center.name}</h3>
                      <p className="mt-1 text-sm text-neutral-500">{center.logisticsProgram}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditCenter(center)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </button>
                      <button
                        type="button"
                        disabled={deleteCenter.isPending}
                        onClick={() => deleteCenter.mutate(center.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <MapPinned className="h-3.5 w-3.5" />
                    {center.latitude != null && center.longitude != null ? (
                      <span>
                        {center.latitude.toFixed(4)}, {center.longitude.toFixed(4)}
                      </span>
                    ) : (
                      <span>Sin coordenadas</span>
                    )}
                    <span className="text-neutral-300">·</span>
                    <span>
                      {center.coveredZoneIds.length > 0
                        ? center.coveredZoneIds.map(zoneName).join(', ')
                        : 'Sin cobertura'}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white">
          <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-4">
            <MapPinned className="h-5 w-5 text-neutral-500" />
            <h2 className="font-semibold text-neutral-900">Zonas</h2>
          </div>

          <form
            onSubmit={zoneForm.handleSubmit((values) => saveZone.mutate(values))}
            className="border-b border-neutral-100 p-5"
          >
            <label className="text-sm font-medium text-neutral-700">
              {editingZone ? `Editar ${editingZone.name}` : 'Nueva zona'}
              <input
                {...zoneForm.register('name')}
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal shadow-sm outline-none focus:border-neutral-500"
                placeholder="Marianao"
              />
              {zoneForm.formState.errors.name && (
                <span className="mt-1 block text-xs text-rose-600">{zoneForm.formState.errors.name.message}</span>
              )}
            </label>
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                disabled={saveZone.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {saveZone.isPending ? 'Guardando…' : editingZone ? 'Guardar' : 'Agregar'}
              </button>
              {editingZone && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingZone(null)
                    zoneForm.reset({ name: '' })
                  }}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {zones.isPending ? (
            <p className="p-5 text-center text-sm text-neutral-500">Cargando zonas…</p>
          ) : zones.isError ? (
            <p className="p-5 text-center text-sm text-rose-600">No se pudieron cargar las zonas.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {(zones.data ?? []).map((zone) => (
                <li key={zone.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="text-sm text-neutral-800">{zone.name}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEditZone(zone)}
                      className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                      aria-label={`Editar ${zone.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={deleteZone.isPending}
                      onClick={() => deleteZone.mutate(zone.id)}
                      className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
                      aria-label={`Eliminar ${zone.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
