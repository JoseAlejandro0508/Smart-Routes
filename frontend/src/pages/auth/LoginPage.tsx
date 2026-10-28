// src/pages/auth/LoginPage.tsx
import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { loginSchema, type LoginValues } from '../../features/auth/schemas'
import { useAuth } from '../../features/auth/AuthProvider'
import { getApiErrorMessage } from '../../api/http'
import { TextField } from '../../components/ui/TextField'
import { PrimaryButton } from '../../components/ui/PrimaryButton'
import { SocialButton } from '../../components/ui/SocialButton'
import { AppleLogo, FacebookLogo, GoogleLogo } from '../../components/ui/BrandLogos'

const REMEMBER_KEY = 'auth.rememberEmail'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)

  // Recados que nos dejaron otras pantallas vía state de navegación
  const registeredEmail =
    (location.state as { registeredEmail?: string } | null)?.registeredEmail
  const passwordReset =
    (location.state as { passwordReset?: boolean } | null)?.passwordReset

  // Bloqueo temporal: cuenta regresiva tras un 429
  const [lockSeconds, setLockSeconds] = useState(0)

  useEffect(() => {
    if (lockSeconds <= 0) return
    const timer = setInterval(() => setLockSeconds((s) => s - 1), 1000)
    return () => clearInterval(timer) // limpieza al llegar a 0 o desmontar
  }, [lockSeconds])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: localStorage.getItem(REMEMBER_KEY) ?? '',
      password: '',
      remember: !!localStorage.getItem(REMEMBER_KEY),
    },
  })

  async function onSubmit(values: LoginValues) {
    // "values" ya pasó Zod: tipado y validado. No re-chequeamos.
    try {
      const res = await login(values.email, values.password)

      if (values.remember) localStorage.setItem(REMEMBER_KEY, values.email)
      else localStorage.removeItem(REMEMBER_KEY)

      if (res.requiresTwoFactor) {
        // El reto viaja en el state de navegación: ni localStorage ni URL
        navigate('/two-factor', { state: { challengeToken: res.challengeToken } })
        return
      }

      const destino =
        (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'
      navigate(destino, { replace: true })
    } catch (err) {
      // El servidor dijo "espera": respetamos la sanción con cuenta regresiva
      if (isAxiosError(err) && err.response?.status === 429) {
        setLockSeconds(30) // el backend real mandaría Retry-After; demo: 30s
      }
      setError('root.server', { message: getApiErrorMessage(err) })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Bienvenido de nuevo.
        </h1>
        <p className="mt-1 text-sm text-neutral-500">Inicia sesión para continuar.</p>
      </header>

      {/* Sociales decorativos: disabled hasta que el backend implemente OAuth */}
      <div className="grid grid-cols-3 gap-3">
        <SocialButton label="Continuar con Google" icon={<GoogleLogo />} />
        <SocialButton label="Continuar con Facebook" icon={<FacebookLogo />} />
        <SocialButton label="Continuar con Apple" icon={<AppleLogo />} />
      </div>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs text-neutral-400">o continúa con tu correo</span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {registeredEmail && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
            Cuenta creada para <strong>{registeredEmail}</strong>. Ahora inicia sesión.
          </p>
        )}

        {passwordReset && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
            Contraseña actualizada. Inicia sesión con la nueva.
          </p>
        )}

        <TextField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="correo@demo.dev"
          leadingIcon={<Mail size={16} />}
          error={errors.email}
          {...register('email')}
        />

        <TextField
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          leadingIcon={<Lock size={16} />}
          error={errors.password}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="grid size-8 place-items-center rounded-md text-neutral-400 transition-colors hover:text-neutral-700"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              className="size-4 rounded border-neutral-300 accent-neutral-900"
              {...register('remember')}
            />
            Recuérdame
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-neutral-900 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {errors.root?.server && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {errors.root.server.message}
          </p>
        )}

        <PrimaryButton disabled={lockSeconds > 0} loading={isSubmitting}>
          {lockSeconds > 0
            ? `Reintenta en ${lockSeconds}s`
            : isSubmitting
              ? 'Entrando…'
              : 'Iniciar sesión'}
        </PrimaryButton>
      </form>

      <p className="text-center text-sm text-neutral-500">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="font-medium text-neutral-900 hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  )
}
