// src/pages/DashboardPage.tsx — zona privada provisional (la cenicienta del login)
import { useAuth } from '../features/auth/AuthProvider'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
      <h1 className="text-3xl font-bold">🏠 Zona privada</h1>
      {user && (
        <p className="text-slate-400">
          Hola, <span className="font-semibold text-slate-100">{user.name}</span> ({user.email}) · rol: {user.role}
        </p>
      )}
      <button onClick={logout} className="rounded-lg bg-rose-600 px-4 py-2 hover:bg-rose-500">
        Cerrar sesión
      </button>
      <Link to="/perfil" className="text-sm text-blue-400 hover:underline">
        Mi perfil
      </Link>
    </main>
  )
}