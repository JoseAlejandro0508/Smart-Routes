// src/pages/ProfilePage.tsx
import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { changePasswordSchema, type ChangePasswordValues } from '../features/auth/schemas'
import { authApi } from '../api/auth.api'
import { getApiErrorMessage } from '../api/http'
import { TextField } from '../components/ui/TextField'
import { PasswordStrength } from '../components/auth/PasswordStrength'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../features/auth/AuthProvider'

export function ProfilePage() {
  const { user } = useAuth()
  const notify = useToast()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      password: '',
      confirmPassword: '',
    },
  })
  const password = watch('password')

  async function onSubmit(values: ChangePasswordValues) {
    try {
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.password,
      })
      notify('Contraseña actualizada')
      reset() // limpia el formulario tras el éxito
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 400) {
        // La actual no coincide → error de CAMPO, con foco
        setError('currentPassword', {
          type: 'server',
          message: getApiErrorMessage(err),
        }, { shouldFocus: true })
      } else {
        setError('root.server', { message: getApiErrorMessage(err) })
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-neutral-900">Perfil</h1>
          {user && (
            <p className="mt-1 text-sm text-neutral-500">
              {user.name} · {user.email} · rol: {user.role}
            </p>
          )}
          <Link to="/" className="mt-3 inline-block text-sm text-neutral-600 hover:text-neutral-900 hover:underline">
            Volver al inicio
          </Link>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-bold text-neutral-900">Cambiar contraseña</h2>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 flex flex-col gap-4">
            <TextField
              label="Contraseña actual"
              type="password"
              autoComplete="current-password"
              error={errors.currentPassword}
              {...register('currentPassword')}
            />

            <div className="flex flex-col gap-2">
              <div className="relative">
                <TextField
                  label="Nueva contraseña"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  error={errors.password}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute top-9 right-3 text-sm text-neutral-400 hover:text-neutral-700"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <TextField
              label="Confirmar nueva contraseña"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword}
              {...register('confirmPassword')}
            />

            {errors.root?.server && (
                <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errors.root.server.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-neutral-900 px-4 py-2 font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Actualizando…' : 'Actualizar contraseña'}
            </button>

            <p className="text-xs text-neutral-500">
              Se cerrarán las sesiones activas en otros dispositivos.
            </p>
          </form>
      </section>
    </div>
  )
}