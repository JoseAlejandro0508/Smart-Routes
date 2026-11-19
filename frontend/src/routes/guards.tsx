// src/routes/guards.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import type { User } from '../api/auth.api'

export function RequireAuth() {
  const { user, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return <p className="p-10 text-slate-400">Restaurando sesión…</p>
  }
  if (!user) {
    // Guardamos de DÓNDE venía el usuario para devolverlo tras el login
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet /> // hay sesión → renderiza la ruta hija
}

export function RequireGuest() {
  const { user, isInitializing } = useAuth()
  if (isInitializing) {
    return <p className="p-10 text-slate-400">Verificando sesión…</p>
  }
  if (user) return <Navigate to="/" replace /> // ya logueado no ve /login
  return <Outlet />
}

// Ruta SOLO para ciertos roles. El menú oculta las opciones que no
// corresponden, pero escribir la URL a mano siempre es posible: la UI
// se defiende en el ROUTER, no solo en la vista (defensa en profundidad).
export function RequireRole({ roles }: { roles: User['role'][] }) {
  const { user, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return <p className="p-10 text-slate-400">Verificando permisos…</p>
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (!roles.includes(user.role)) {
    // Tiene sesión pero no el rol → a su home. El menú nunca le mostró
    // la opción: esto cubre el caso "URL escrita a mano".
    return <Navigate to="/" replace />
  }
  return <Outlet />
}