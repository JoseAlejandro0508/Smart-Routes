// src/pages/auth/ResetPasswordPage.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react'
import { resetSchema, type ResetValues } from '../../features/auth/schemas'
import { authApi } from '../../api/auth.api'
import { getApiErrorMessage } from '../../api/http'
import { TextField } from '../../components/ui/TextField'
import { PrimaryButton } from '../../components/ui/PrimaryButton'
import { PasswordStrength } from '../../components/auth/PasswordStrength'
import { useToast } from '../../components/ui/Toast'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [showPassword, setShowPassword] = useState(false)
  const notify = useToast()
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })
  const password = watch('password')

  async function onSubmit(values: ResetValues) {
    if (!token) return
    try {
      await authApi.reset({ token, newPassword: values.password })
      notify('Contraseña actualizada')
      navigate('/login', { replace: true, state: { passwordReset: true } })
    } catch (err) {
      setError('root.server', { message: getApiErrorMessage(err) })
    }
  }

  // Sin token en la URL → no hay nada que restablecer
  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-rose-100 text-rose-600">
          <AlertCircle size={28} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Enlace inválido
        </h1>
        <p className="text-sm text-neutral-500">
          Este enlace de restablecimiento no es válido o ya fue utilizado.
        </p>
        <Link
          to="/forgot-password"
          className="mt-2 text-sm font-medium text-neutral-900 hover:underline"
        >
          Solicitar uno nuevo
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Crea tu nueva contraseña
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Elige una contraseña fuerte que no uses en otros sitios.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <TextField
            label="Nueva contraseña"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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
          <PasswordStrength password={password} />
        </div>

        <TextField
          label="Confirmar nueva contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          leadingIcon={<Lock size={16} />}
          error={errors.confirmPassword}
          {...register('confirmPassword')}
        />

        {errors.root?.server && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {errors.root.server.message}
          </p>
        )}

        <PrimaryButton loading={isSubmitting}>
          {isSubmitting ? 'Actualizando…' : 'Actualizar contraseña'}
        </PrimaryButton>

        <p className="text-xs text-neutral-400">
          Al cambiarla se cerrarán todas tus sesiones activas.
        </p>
      </form>
    </div>
  )
}
