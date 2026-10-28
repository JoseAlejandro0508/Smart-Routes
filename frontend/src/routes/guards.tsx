// src/routes/guards.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'

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