import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, Shield, UserMinus } from 'lucide-react'
import { adminApi, type AdminUserRole } from '../api/admin.api'
import type { UserRole } from '../api/auth.api'
import { ROLE_LABELS } from '../components/layout/navConfig'

const roles: UserRole[] = ['Administrator', 'LogisticsCoordinator', 'OperationsSupervisor', 'DeliveryPerson']

export function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [draftRoles, setDraftRoles] = useState<Record<string, UserRole | null>>({})
  const users = useQuery({ queryKey: ['admin-user-roles'], queryFn: adminApi.listUserRoles })
  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) => adminApi.updateUserRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] }),
  })
  const removeRole = useMutation({
    mutationFn: adminApi.deleteUserRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] }),
  })

  function roleFor(user: AdminUserRole) {
    return draftRoles[user.id] === undefined ? user.role : draftRoles[user.id]
  }

  return (
    <div className="space-y-6">
      <header><p className="text-sm font-medium text-neutral-500">Administración</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Usuarios y roles</h1><p className="mt-1 text-sm text-neutral-500">Asigna un único rol operativo a cada usuario del sistema.</p></header>
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {users.isPending ? <p className="p-8 text-center text-sm text-neutral-500">Cargando usuarios…</p> : users.isError ? <p className="p-8 text-center text-sm text-rose-600">No se pudieron cargar los usuarios.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-5 py-3 font-medium">Usuario</th><th className="px-5 py-3 font-medium">Rol actual</th><th className="px-5 py-3 font-medium">Nuevo rol</th><th className="px-5 py-3 text-right font-medium">Acciones</th></tr></thead><tbody className="divide-y divide-neutral-100">{users.data?.map((user) => <tr key={user.id}><td className="px-5 py-4"><p className="font-medium text-neutral-900">{user.name}</p><p className="mt-1 text-xs text-neutral-500">{user.email}</p></td><td className="px-5 py-4">{user.role ? <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"><Shield className="h-3.5 w-3.5" />{ROLE_LABELS[user.role]}</span> : <span className="text-sm text-neutral-400">Sin rol</span>}</td><td className="px-5 py-4"><select value={roleFor(user) ?? ''} onChange={(event) => setDraftRoles((draft) => ({ ...draft, [user.id]: (event.target.value || null) as UserRole | null }))} className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-500"><option value="">Sin rol</option>{roles.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</select></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" disabled={!roleFor(user) || updateRole.isPending} onClick={() => updateRole.mutate({ userId: user.id, role: roleFor(user)! })} className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-700 disabled:opacity-40"><Save className="h-3.5 w-3.5" /> Guardar</button><button type="button" disabled={!user.role || removeRole.isPending} onClick={() => removeRole.mutate(user.id)} title="Quitar rol" className="inline-flex items-center justify-center rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-40"><UserMinus className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  )
}