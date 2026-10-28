// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from './components/ui/Toast'
import { AuthProvider } from './features/auth/AuthProvider'
import { ProfilePage } from './pages/ProfilePage'
import { RequireAuth, RequireGuest } from './routes/guards'
import { AuthLayout } from './pages/auth/AuthLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { TwoFactorPage } from './pages/auth/TwoFactorPage'
import { DashboardPage } from './pages/DashboardPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ErrorBoundary } from './components/ErrorBoundary'

// Singleton FUERA del componente: la instancia debe ser estable
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: true },
  },
})

// Orden de los proveedores: cada uno consume el contexto del que está
// encima → QueryClient (useQuery) → Toast (global) → Router (useNavigate)
// → Auth (useAuth). Toast va afuera del Router para sobrevivir navegaciones.
// ErrorBoundary va ARRIBA DE TODO: es la última red, atrapa cualquier
// error de render de la app entera.
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route element={<RequireGuest />}>
                  <Route element={<AuthLayout />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/two-factor" element={<TwoFactorPage />} />
                  </Route>
                </Route>

                <Route element={<RequireAuth />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/perfil" element={<ProfilePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}