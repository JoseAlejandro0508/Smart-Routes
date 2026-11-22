import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Truck, UserPlus, X } from 'lucide-react'
import { actorsApi } from '../api/actors.api'
import { adminApi } from '../api/admin.api'
import { centersApi } from '../api/centers.api'
import { getApiErrorMessage } from '../api/http'
import { deliveryPersonSchema, type DeliveryPersonFormValues } from '../features/actors/schemas'

function ageFromBirthDay(birthDay: string) {
  const date = new Date(birthDay)
  if (Number.isNaN(date.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const m = today.getMonth() - date.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--
  return age
}

/** Gestión de repartidores: listado y alta con datos reales. */
export function RepartidoresPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [actionError, setActionError] = useState('')

  const deliveryPersons = useQuery({ queryKey: ['delivery-persons'], queryFn: adminApi.listDeliveryPersons })
  const centers = useQuery({ queryKey: ['centers'], queryFn: centersApi.list })

  const form = useForm<DeliveryPersonFormValues>({
    resolver: zodResolver(deliveryPersonSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      birthDay: '',
      fleet: '',
      distributionCenterIds: [],
    },
  })

  const createPerson = useMutation({
    mutationFn: actorsApi.createDeliveryPerson,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['delivery-persons'] })
      form.reset({ email: '', password: '', firstName: '', lastName: '', birthDay: '', fleet: '', distributionCenterIds: [] })
      setFormOpen(false)
      setActionError('')
    },
    onError: (error) => setActionError(getApiErrorMessage(error, 'No se pudo crear el repartidor.')),
  })

  function toggleCenter(centerId: number) {
    const current = form.getValues('distributionCenterIds')
    form.setValue(
      'distributionCenterIds',
      current.includes(centerId) ? current.filter((id) => id !== centerId) : [...current, centerId],
      { shouldDirty: true, shouldValidate: true },
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-500">Administración</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Repartidores</h1>
          <p className="mt-1 text-sm text-neutral-500">Gestiona repartidores, su edad, flota y centros asignados.</p>
        </div>
        <button type="button" onClick={() => setFormOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700">
          {formOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {formOpen ? 'Cerrar formulario' : 'Nuevo repartidor'}
        </button>
      </header>

      {actionError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</p>}

      {formOpen && (
        <form onSubmit={form.handleSubmit((values) => { setActionError(''); createPerson.mutate(values) })} className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-2"><UserPlus className="h-5 w-5 text-neutral-500" /><h2 className="font-semibold text-neutral-900">Crear repartidor</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-neutral-700">Nombre<input {...form.register('firstName')} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />{form.formState.errors.firstName && <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.firstName.message}</span>}</label>
            <label className="text-sm font-medium text-neutral-700">Apellidos<input {...form.register('lastName')} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />{form.formState.errors.lastName && <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.lastName.message}</span>}</label>
            <label className="text-sm font-medium text-neutral-700">Correo<input type="email" {...form.register('email')} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />{form.formState.errors.email && <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.email.message}</span>}</label>
            <label className="text-sm font-medium text-neutral-700">Contraseña inicial<input type="password" {...form.register('password')} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />{form.formState.errors.password && <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.password.message}</span>}</label>
            <label className="text-sm font-medium text-neutral-700">Fecha de nacimiento<input type="date" {...form.register('birthDay')} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />{form.formState.errors.birthDay && <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.birthDay.message}</span>}</label>
            <label className="text-sm font-medium text-neutral-700">Flota<input {...form.register('fleet')} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" placeholder="Ej. Flota Norte" />{form.formState.errors.fleet && <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.fleet.message}</span>}</label>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-neutral-700">Centros de distribución asignados</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(centers.data ?? []).map((center) => (
                <label key={center.id} className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                  <input type="checkbox" checked={form.watch('distributionCenterIds').includes(center.id)} onChange={() => toggleCenter(center.id)} />
                  {center.name}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={createPerson.isPending} className="mt-5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50">{createPerson.isPending ? 'Creando…' : 'Crear repartidor'}</button>
        </form>
      )}

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-neutral-900"><Truck className="h-4 w-4" /> Repartidores registrados</h2></div>
        {deliveryPersons.isPending ? <p className="p-8 text-center text-sm text-neutral-500">Cargando repartidores…</p> : deliveryPersons.isError ? <p className="p-8 text-center text-sm text-rose-600">No se pudieron cargar los repartidores.</p> : (deliveryPersons.data ?? []).length === 0 ? <p className="p-8 text-center text-sm text-neutral-500">No hay repartidores registrados.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-5 py-3 font-medium">Repartidor</th><th className="px-5 py-3 font-medium">Edad</th><th className="px-5 py-3 font-medium">Flota</th><th className="px-5 py-3 font-medium">Centros</th><th className="px-5 py-3 font-medium">Nacimiento</th></tr></thead>
              <tbody className="divide-y divide-neutral-100">
                {(deliveryPersons.data ?? []).map((person) => {
                  const centersLabel = person.centerNames?.length ? person.centerNames.join(', ') : person.distributionCenterIds?.length ? person.distributionCenterIds.map((id) => `Centro #${id}`).join(', ') : 'Pendiente (backend)'
                  return (
                  <tr key={person.id}>
                    <td className="px-5 py-4"><p className="font-medium text-neutral-900">{person.name}</p><p className="mt-1 text-xs text-neutral-500">{person.email}</p></td>
                    <td className="px-5 py-4 text-neutral-700">{ageFromBirthDay(person.dateOfBirth) ?? '—'}</td>
                    <td className="px-5 py-4 text-neutral-700">{person.fleet}</td>
                    <td className="px-5 py-4 text-neutral-500">{centersLabel}</td>
                    <td className="px-5 py-4 text-neutral-500">{person.dateOfBirth}</td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
