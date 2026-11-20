// src/features/auth/AuthProvider.tsx
import { createContext, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi, isUser, type LoginResponse, type User } from '../../api/auth.api'
import { tokenStore } from '../../api/http'

/** Clave de caché de TanStack Query para la sesión autenticada. */
export const SESSION_KEY = ['auth', 'me'] as const

interface AuthContextValue {
  user: User | null
  isInitializing: boolean
  login: (email: string, password: string) => Promise<LoginResponse>
  verify2FA: (challengeToken: string, code: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Proveedor de autenticación que mantiene la sesión, tokens y acciones de acceso. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // La sesión viva: GET /auth/me con el token guardado 
  // Esto es lo que hace que F5 no te bote: al recargar, hay token
  // en localStorage → se consulta /me → el cache se llena → sesión viva.
  // fetchMe valida la forma: una respuesta inválida se trata como "sin sesión".
  async function fetchMe(): Promise<User | null> {
    const me = await authApi.me()
    return isUser(me) ? me : null
  }

  const { data, isPending } = useQuery({
    queryKey: SESSION_KEY,
    queryFn: fetchMe,
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
      queryClient.setQueryData(SESSION_KEY, await fetchMe())
    }
    return res
  }

  async function verify2FA(challengeToken: string, code: string): Promise<void> {
    const res = await authApi.verify2FA(challengeToken, code)
    tokenStore.set(res.accessToken, res.refreshToken)
    queryClient.setQueryData(SESSION_KEY, await fetchMe())
  }

  async function logout() {
    // Revocamos el refresh token en el servidor antes de olvidar la sesión.
    // Si la red falla, el cliente se cierra igual: la seguridad local manda.
    try {
      await authApi.logout(tokenStore.refresh)
    } catch {
      // La sesión local se limpia de todos modos.
    }

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

/** Hook de acceso al contexto de autenticación; debe usarse dentro de `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}