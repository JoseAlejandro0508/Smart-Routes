import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, UserCog, UserPlus, X } from 'lucide-react'
import { actorsApi } from '../api/actors.api'
import { adminApi } from '../api/admin.api'
import { centersApi } from '../api/centers.api'
import { getApiErrorMessage } from '../api/http'
import { coordinatorSchema, type CoordinatorFormValues } from '../features/actors/schemas'

/** Gestión de coordinadores logísticos. */
export function CoordinadoresPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [actionError, setActionError] = useState('')
  const coordinators = useQuery({ queryKey: ['coordinators'], queryFn: adminApi.listCoordinators })
  const centers = useQuery({ queryKey: ['centers'], queryFn: centersApi.list })

  const form = useForm<CoordinatorFormValues>({
    resolver: zodResolver(coordinatorSchema),
    defaultValues: { email: '', password: '', firstName: '', lastName: '', specialty: '', authorizedCenterIds: [] },
  })

  const createCoordinator = useMutation({
    mutationFn: actorsApi.createCoordinator,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['coordinators'] })
      form.reset({ email: '', password: '', firstName: '', lastName: '', specialty: '', authorizedCenterIds: [] })
      setFormOpen(false)
      setActionError('')
    },
    onError: (error) => setActionError(getApiErrorMessage(error, 'No se pudo crear el coordinador.')),
  })

  function toggleCenter(centerId: number) {
    const current = form.getValues('authorizedCenterIds')
    form.setValue('authorizedCenterIds', current.includes(centerId) ? current.filter((id) => id !== centerId) : [...current, centerId], { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-medium text-neutral-500">Administración</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Coordinadores logísticos</h1><p className="mt-1 text-sm text-neutral-500">Gestiona coordinadores, su especialidad y centros autorizados.</p></div>
        <button type="button" onClick={() => setFormOpen((o) => !o)} className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700">{formOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{formOpen ? 'Cerrar formulario' : 'Nuevo coordinador'}</button>
      </header>
      {actionError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</p>}
      {formOpen && (
        <form onSubmit={form.handleSubmit((values) => { setActionError(''); createCoordinator.mutate(values) })} className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-2"><UserPlus className="h-5 w-5 text-neutral-500" /><h2 className="font-semibold text-neutral-900">Crear coordinador</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-neutral-700">Nombre<input {...form.register('firstName')} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />{form.formState.errors.firstName && <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.firstName.message}</span>}</label>
            <label className="text-sm font-medium text-neutral-700">Apellidos<input {...form.register('lastName')} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />{form.formState.errors.lastName && <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.lastName.message}</span>}</label>
            <label className="text-sm font-medium text-neutral-700">Correo<input type="email" {...form.register('email')} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />{form.formState.errors.email && <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.email.message}</span>}</label>
            <label className="text-sm font-medium text-neutral-700">Contraseña inicial<input type="password" {...form.register('password')} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />{form.formState.errors.password && <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.password.message}</span>}</label>
            <label className="text-sm font-medium text-neutral-700 md:col-span-2">Especialidad<input {...form.register('specialty')} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />{form.formState.errors.specialty && <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.specialty.message}</span>}</label>
          </div>
          <div className="mt-4"><p className="text-sm font-medium text-neutral-700">Centros autorizados</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{(centers.data ?? []).map((center) => <label key={center.id} className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm"><input type="checkbox" checked={form.watch('authorizedCenterIds').includes(center.id)} onChange={() => toggleCenter(center.id)} />{center.name}</label>)}</div></div>
          <button type="submit" disabled={createCoordinator.isPending} className="mt-5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50">{createCoordinator.isPending ? 'Creando…' : 'Crear coordinador'}</button>
        </form>
      )}
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-neutral-900"><UserCog className="h-4 w-4" /> Coordinadores registrados</h2></div>
        {coordinators.isPending ? <p className="p-8 text-center text-sm text-neutral-500">Cargando coordinadores…</p> : coordinators.isError ? <p className="p-8 text-center text-sm text-rose-600">No se pudieron cargar los coordinadores.</p> : (coordinators.data ?? []).length === 0 ? <p className="p-8 text-center text-sm text-neutral-500">No hay coordinadores registrados.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-5 py-3 font-medium">Coordinador</th><th className="px-5 py-3 font-medium">Especialidad</th><th className="px-5 py-3 font-medium">Centros autorizados</th></tr></thead><tbody className="divide-y divide-neutral-100">{(coordinators.data ?? []).map((c) => <tr key={c.id}><td className="px-5 py-4"><p className="font-medium text-neutral-900">{c.name}</p><p className="mt-1 text-xs text-neutral-500">{c.email}</p></td><td className="px-5 py-4 text-neutral-700">{c.specialty}</td><td className="px-5 py-4 text-neutral-500">{c.authorizedCenterIds.length ? c.authorizedCenterIds.join(', ') : '—'}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  )
}
