// src/features/auth/AuthProvider.tsx
import { createContext, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi, type LoginResponse, type User } from '../../api/auth.api'
import { tokenStore } from '../../api/http'

// Clave ESTABLE de cache. La sesión vive aquí, no en useState suelto.
export const SESSION_KEY = ['auth', 'me'] as const

interface AuthContextValue {
  user: User | null
  isInitializing: boolean
  login: (email: string, password: string) => Promise<LoginResponse>
  verify2FA: (challengeToken: string, code: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // La sesión viva: GET /auth/me con el token guardado 
  // Esto es lo que hace que F5 no te bote: al recargar, hay token
  // en localStorage → se consulta /me → el cache se llena → sesión viva.
  const { data, isPending } = useQuery({
    queryKey: SESSION_KEY,
    queryFn: () => authApi.me(),
    retry: false,             // un 401 aquí NO se reintenta (no es fallo de red)
    enabled: !!tokenStore.access, // sin token ni lo intentes
    staleTime: 5 * 60 * 1000, // 5 min sin refetch innecesario
  })

  const user = data ?? null
  const isInitializing = isPending && !!tokenStore.access

  // Acciones 

  async function login(email: string, password: string): Promise<LoginResponse> {
    const res = await authApi.login(email, password)
    if (!res.requiresTwoFactor) {
      tokenStore.set(res.accessToken, res.refreshToken)
      // Sembramos el cache con el usuario real. ¿Por qué setQueryData y
      // no invalidateQueries? Porque esta query nació DESHABILITADA (no
      // había token al montar) y localStorage no dispara re-renders:
      // la invalidación no la despertaría. setQueryData sí actualiza
      // a los observadores al instante.
      queryClient.setQueryData(SESSION_KEY, await authApi.me())
    }
    return res
  }

  async function verify2FA(challengeToken: string, code: string): Promise<void> {
    const res = await authApi.verify2FA(challengeToken, code)
    tokenStore.set(res.accessToken, res.refreshToken)
    queryClient.setQueryData(SESSION_KEY, await authApi.me())
  }

  function logout() {
    // TODO (backend real): POST /auth/logout para REVOCAR el refresh
    // token del lado del servidor. Revocar solo en el cliente deja
    // el refresh válido en la naturaleza. Para la defensa de tu proyecto.
    tokenStore.clear()
    queryClient.setQueryData(SESSION_KEY, null)
    navigate('/login', { replace: true })
    // replace: true → no ensuciamos el historial: el botón "atrás"
    // no te devuelve a la sesión recién cerrada.
  }

  // El interceptor nos habla por evento (sesión muerta) 
  useEffect(() => {
    const onSessionExpired = () => {
      tokenStore.clear()
      queryClient.setQueryData(SESSION_KEY, null)
      navigate('/login', { replace: true })
    }
    window.addEventListener('auth:session-expired', onSessionExpired)
    return () =>
      window.removeEventListener('auth:session-expired', onSessionExpired)
  }, [navigate, queryClient])

  return (
    <AuthContext.Provider value={{ user, isInitializing, login, verify2FA, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook de acceso único a la sesión (Fachada del sistema de auth)
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}