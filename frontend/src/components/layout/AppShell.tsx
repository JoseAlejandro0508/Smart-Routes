// src/components/layout/AppShell.tsx
// El "casco" de la zona privada: sidebar colapsable + topbar + contenido.
//  - Navegación DATA-DRIVEN (navConfig.ts): el menú se auto-filtra con
//    los roles del usuario de la sesión.
//  - El colapso se persiste en localStorage: la app recuerda tu gusto.
//  - En móvil (< lg) la sidebar es un drawer con hamburguesa — el mismo
//    corte que usa el layout de auth.
//  - Ocultar del menú NO basta: RequireRole (routes/guards.tsx) defiende
//    las rutas si alguien escribe la URL a mano (defensa en profundidad).
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronsLeft, ChevronsRight, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthProvider'
import { NAV_ITEMS, ROLE_LABELS } from './navConfig'

const COLLAPSE_KEY = 'shell.sidebar-collapsed'

// Contenido compartido entre la sidebar de escritorio y el drawer móvil:
// una sola fuente de verdad para marca + menú + pie de usuario.
function SidebarContent({
  colapsada,
  mostrarToggle = false,
  onToggleColapso,
  onNavegar,
}: {
  colapsada: boolean
  mostrarToggle?: boolean
  onToggleColapso?: () => void
  onNavegar?: () => void
}) {
  const { user, logout } = useAuth()
  const visibles = NAV_ITEMS.filter((i) => user && i.roles.includes(user.role))

  const iniciales = (user?.name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <>
      {/* Marca */}
      <div className="flex h-16 shrink-0 items-center border-b border-neutral-200 px-4">
        <Link
          to="/"
          onClick={onNavegar}
          className={`flex items-center gap-2.5 ${colapsada ? 'w-full justify-center' : ''}`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-[13px] font-bold text-white">
            SR
          </span>
          {!colapsada && <span className="text-sm font-semibold text-neutral-900">Smart Routes</span>}
        </Link>
      </div>

      {/* Menú */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibles.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavegar}
            title={colapsada ? label : undefined}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-neutral-100 font-medium text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                colapsada && 'justify-center px-0',
              ]
                .filter(Boolean)
                .join(' ')
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!colapsada && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Pie: usuario + acciones */}
      <div className="shrink-0 border-t border-neutral-200 p-3">
        <div className={`flex items-center gap-3 ${colapsada ? 'justify-center' : 'px-2'}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
            {iniciales}
          </span>
          {!colapsada && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">{user?.name}</p>
              <p className="truncate text-xs text-neutral-500">{user ? ROLE_LABELS[user.role] : ''}</p>
            </div>
          )}
        </div>
        <div className={`mt-2 flex gap-1 ${colapsada ? 'justify-center' : ''}`}>
          {mostrarToggle && (
            <button
              type="button"
              onClick={onToggleColapso}
              title={colapsada ? 'Expandir menú' : 'Colapsar menú'}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              {colapsada ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            title="Cerrar sesión"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )
}

export function AppShell() {
  const { user, logout } = useAuth()
  // Estado inicial leído UNA vez desde localStorage (preferencia persistente)
  const [colapsada, setColapsada] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1')
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [menuUsuario, setMenuUsuario] = useState(false)
  const location = useLocation()

  function toggleColapso() {
    setColapsada((actual) => {
      localStorage.setItem(COLLAPSE_KEY, actual ? '0' : '1')
      return !actual
    })
  }

  // Título del topbar: el ítem de nav cuya ruta coincide con la actual.
  // Rutas fuera del menú (p. ej. /perfil) tienen título propio.
  const itemActual = NAV_ITEMS.find((i) =>
    i.to === '/' ? location.pathname === '/' : location.pathname.startsWith(i.to),
  )
  const titulo =
    itemActual?.label ??
    ({ '/perfil': 'Mi perfil' } as Record<string, string>)[location.pathname] ??
    'Smart Routes'

  const iniciales = (user?.name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* ── Sidebar de escritorio: fija, colapsable ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-neutral-200 bg-white transition-[width] duration-200 lg:flex ${
          colapsada ? 'w-[68px]' : 'w-64'
        }`}
      >
        <SidebarContent colapsada={colapsada} mostrarToggle onToggleColapso={toggleColapso} />
      </aside>

      {/* ── Drawer móvil ── */}
      {drawerAbierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-neutral-950/40"
            onClick={() => setDrawerAbierto(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setDrawerAbierto(false)}
              className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent colapsada={false} onNavegar={() => setDrawerAbierto(false)} />
          </aside>
        </div>
      )}

      {/* ── Columna principal: topbar + contenido ── */}
      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-200 ${
          colapsada ? 'lg:pl-[68px]' : 'lg:pl-64'
        }`}
      >
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerAbierto(true)}
            aria-label="Abrir menú"
            className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <h1 className="text-sm font-semibold">{titulo}</h1>

          {/* Menú del usuario */}
          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() => setMenuUsuario((v) => !v)}
              className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-neutral-100"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                {iniciales}
              </span>
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            </button>

            {menuUsuario && (
              <>
                {/* Capa invisible: cierra el menú al hacer click afuera */}
                <button
                  type="button"
                  aria-label="Cerrar menú de usuario"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuUsuario(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-neutral-200 bg-white p-1 shadow-lg">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-medium">{user?.name}</p>
                    <p className="truncate text-xs text-neutral-500">{user?.email}</p>
                  </div>
                  <div className="my-1 h-px bg-neutral-100" />
                  <Link
                    to="/perfil"
                    onClick={() => setMenuUsuario(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    Mi perfil
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuUsuario(false)
                      logout()
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" /> Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
