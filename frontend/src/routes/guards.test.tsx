import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '../api/auth.api'
import { RequireAuth, RequireGuest, RequireRole } from './guards'

const auth = vi.hoisted(() => ({
  user: null as User | null,
  isInitializing: false,
}))

vi.mock('../features/auth/AuthProvider', () => ({
  useAuth: () => auth,
}))

function renderWithRouter(initialPath: string, element: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<p>Login</p>} />
        <Route path="/" element={<p>Inicio</p>} />
        {element}
      </Routes>
    </MemoryRouter>,
  )
}

const coordinator = {
  id: 'u-1',
  name: 'Ana',
  email: 'ana@smartroutes.test',
  role: 'LogisticsCoordinator',
} satisfies User

beforeEach(() => {
  auth.user = null
  auth.isInitializing = false
})

describe('RequireAuth', () => {
  it('muestra el estado de restauración mientras se comprueba la sesión', () => {
    auth.isInitializing = true
    renderWithRouter(
      '/privada',
      <Route path="/privada" element={<RequireAuth />}>
        <Route index element={<p>Zona privada</p>} />
      </Route>,
    )
    expect(screen.getByText('Restaurando sesión…')).toBeInTheDocument()
  })

  it('redirige al login cuando no hay sesión', () => {
    renderWithRouter(
      '/privada',
      <Route path="/privada" element={<RequireAuth />}>
        <Route index element={<p>Zona privada</p>} />
      </Route>,
    )
    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('deja pasar a un usuario autenticado', () => {
    auth.user = coordinator
    renderWithRouter(
      '/privada',
      <Route path="/privada" element={<RequireAuth />}>
        <Route index element={<p>Zona privada</p>} />
      </Route>,
    )
    expect(screen.getByText('Zona privada')).toBeInTheDocument()
  })
})

describe('RequireGuest', () => {
  it('muestra el estado de verificación', () => {
    auth.isInitializing = true
    renderWithRouter(
      '/login',
      <Route path="/login" element={<RequireGuest />}>
        <Route index element={<p>Login</p>} />
      </Route>,
    )
    expect(screen.getByText('Verificando sesión…')).toBeInTheDocument()
  })

  it('redirige al inicio si ya hay sesión', () => {
    auth.user = coordinator
    renderWithRouter(
      '/login',
      <Route path="/login" element={<RequireGuest />}>
        <Route index element={<p>Login</p>} />
      </Route>,
    )
    expect(screen.getByText('Inicio')).toBeInTheDocument()
  })

  it('deja pasar a un invitado', () => {
    renderWithRouter(
      '/login',
      <Route path="/login" element={<RequireGuest />}>
        <Route index element={<p>Login</p>} />
      </Route>,
    )
    expect(screen.getByText('Login')).toBeInTheDocument()
  })
})

describe('RequireRole', () => {
  it('muestra el estado de verificación de permisos', () => {
    auth.isInitializing = true
    renderWithRouter(
      '/admin',
      <Route path="/admin" element={<RequireRole roles={['Administrator']} />}>
        <Route index element={<p>Administración</p>} />
      </Route>,
    )
    expect(screen.getByText('Verificando permisos…')).toBeInTheDocument()
  })

  it('redirige al login sin sesión', () => {
    renderWithRouter(
      '/admin',
      <Route path="/admin" element={<RequireRole roles={['Administrator']} />}>
        <Route index element={<p>Administración</p>} />
      </Route>,
    )
    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('redirige al inicio si el rol no está permitido', () => {
    auth.user = coordinator
    renderWithRouter(
      '/admin',
      <Route path="/admin" element={<RequireRole roles={['Administrator']} />}>
        <Route index element={<p>Administración</p>} />
      </Route>,
    )
    expect(screen.getByText('Inicio')).toBeInTheDocument()
  })

  it('deja pasar si el rol está permitido', () => {
    auth.user = coordinator
    renderWithRouter(
      '/admin',
      <Route path="/admin" element={<RequireRole roles={['LogisticsCoordinator']} />}>
        <Route index element={<p>Administración</p>} />
      </Route>,
    )
    expect(screen.getByText('Administración')).toBeInTheDocument()
  })
})
