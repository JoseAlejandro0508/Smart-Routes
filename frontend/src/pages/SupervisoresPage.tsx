import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardCheck, Plus, UserPlus, X } from 'lucide-react'
import { actorsApi } from '../api/actors.api'
import { adminApi } from '../api/admin.api'
import { getApiErrorMessage } from '../api/http'
import { supervisorSchema, type SupervisorFormValues } from '../features/actors/schemas'

/** Gestión de supervisores de operaciones. */
export function SupervisoresPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [actionError, setActionError] = useState('')
  const supervisors = useQuery({ queryKey: ['supervisors'], queryFn: adminApi.listSupervisors })

  const form = useForm<SupervisorFormValues>({
    resolver: zodResolver(supervisorSchema),
    defaultValues: { email: '', password: '', firstName: '', lastName: '', controlArea: '' },
  })

  const createSupervisor = useMutation({
    mutationFn: actorsApi.createSupervisor,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['supervisors'] })
      form.reset({ email: '', password: '', firstName: '', lastName: '', controlArea: '' })
      setFormOpen(false)
      setActionError('')
    },
    onError: (error) => setActionError(getApiErrorMessage(error, 'No se pudo crear el supervisor.')),
  })

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-medium text-neutral-500">Administración</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Supervisores de operaciones</h1><p className="mt-1 text-sm text-neutral-500">Gestiona supervisores y su área de control.</p></div>
        <button type="button" onClick={() => setFormOpen((o) => !o)} className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700">{formOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{formOpen ? 'Cerrar formulario' : 'Nuevo supervisor'}</button>
      </header>
      {actionError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</p>}
      {formOpen && (
        <form onSubmit={form.handleSubmit((values) => { setActionError(''); createSupervisor.mutate(values) })} className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-2"><UserPlus className="h-5 w-5 text-neutral-500" /><h2 className="font-semibold text-neutral-900">Crear supervisor</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-neutral-700">Nombre<input {...form.register('firstName')} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />{form.formState.errors.firstName && <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.firstName.message}</span>}</label>
            <label className="text-sm font-medium text-neutral-700">Apellidos<input {...form.register('lastName')} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />{form.formState.errors.lastName && <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.lastName.message}</span>}</label>
            <label className="text-sm font-medium text-neutral-700">Correo<input type="email" {...form.register('email')} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />{form.formState.errors.email && <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.email.message}</span>}</label>
            <label className="text-sm font-medium text-neutral-700">Contraseña inicial<input type="password" {...form.register('password')} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />{form.formState.errors.password && <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.password.message}</span>}</label>
            <label className="text-sm font-medium text-neutral-700 md:col-span-2">Área de control<input {...form.register('controlArea')} className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal outline-none focus:border-neutral-500" />{form.formState.errors.controlArea && <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.controlArea.message}</span>}</label>
          </div>
          <button type="submit" disabled={createSupervisor.isPending} className="mt-5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50">{createSupervisor.isPending ? 'Creando…' : 'Crear supervisor'}</button>
        </form>
      )}
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-neutral-900"><ClipboardCheck className="h-4 w-4" /> Supervisores registrados</h2></div>
        {supervisors.isPending ? <p className="p-8 text-center text-sm text-neutral-500">Cargando supervisores…</p> : supervisors.isError ? <p className="p-8 text-center text-sm text-rose-600">No se pudieron cargar los supervisores.</p> : (supervisors.data ?? []).length === 0 ? <p className="p-8 text-center text-sm text-neutral-500">No hay supervisores registrados.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-5 py-3 font-medium">Supervisor</th><th className="px-5 py-3 font-medium">Área de control</th></tr></thead><tbody className="divide-y divide-neutral-100">{(supervisors.data ?? []).map((s) => <tr key={s.id}><td className="px-5 py-4"><p className="font-medium text-neutral-900">{s.name}</p><p className="mt-1 text-xs text-neutral-500">{s.email}</p></td><td className="px-5 py-4 text-neutral-700">{s.controlArea}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  )
}
