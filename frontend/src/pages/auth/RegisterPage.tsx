// src/pages/auth/RegisterPage.tsx
import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { registerSchema, type RegisterValues } from '../../features/auth/schemas'
import { authApi } from '../../api/auth.api'
import { getApiErrorMessage } from '../../api/http'
import { TextField } from '../../components/ui/TextField'
import { PrimaryButton } from '../../components/ui/PrimaryButton'
import { PasswordStrength } from '../../components/auth/PasswordStrength'
import { useToast } from '../../components/ui/Toast'

export function RegisterPage() {
  const navigate = useNavigate()
  const notify = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  })

  // watch(): lectura REACTIVA de un campo que sigue siendo no controlado.
  // El input no re-renderiza nada por tecla, pero el medidor sí se
  // actualiza. Lo mejor de ambos mundos.
  const password = watch('password')

  async function onSubmit(values: RegisterValues) {
    try {
      // Solo los campos del CONTRATO: confirmPassword y acceptTerms
      // son reglas de UI, el servidor no los espera
      await authApi.register({
        name: values.name,
        email: values.email,
        password: values.password,
      })

      notify('Cuenta creada con éxito')

      // Éxito → al login con el email "recordado" en el state de navegación
      navigate('/login', {
        replace: true,
        state: { registeredEmail: values.email },
      })
    } catch (err) {
      // 409 = correo ya registrado → error de CAMPO, con foco automático
      if (isAxiosError(err) && err.response?.status === 409) {
        setError('email', {
          type: 'server',
          message: getApiErrorMessage(err),
        }, { shouldFocus: true })
      } else {
        setError('root.server', { message: getApiErrorMessage(err) })
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Crea tu cuenta.
        </h1>
        <p className="mt-1 text-sm text-neutral-500">Estás a un minuto de empezar.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <TextField
          label="Nombre"
          autoComplete="name"
          placeholder="Tu nombre"
          leadingIcon={<User size={16} />}
          error={errors.name}
          {...register('name')}
        />

        <TextField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.dev"
          leadingIcon={<Mail size={16} />}
          error={errors.email}
          {...register('email')}
        />

        <div className="flex flex-col gap-2">
          {/* autoComplete="new-password": el gestor de claves OFRECE generarla */}
          <TextField
            label="Contraseña"
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

        {/* El error del superRefine (contraseñas que no coinciden) cae aquí */}
        <TextField
          label="Confirmar contraseña"
          type={showConfirm ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="••••••••"
          leadingIcon={<Lock size={16} />}
          error={errors.confirmPassword}
          trailing={
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="grid size-8 place-items-center rounded-md text-neutral-400 transition-colors hover:text-neutral-700"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          {...register('confirmPassword')}
        />

        <div className="flex flex-col gap-1">
          <label className="flex items-start gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-neutral-300 accent-neutral-900"
              {...register('acceptTerms')}
            />
            <span>Acepto los términos y condiciones</span>
          </label>
          {errors.acceptTerms && (
            <p role="alert" className="text-xs text-rose-600">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        {errors.root?.server && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {errors.root.server.message}
          </p>
        )}

        <PrimaryButton loading={isSubmitting}>
          {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </PrimaryButton>
      </form>

      <p className="text-center text-sm text-neutral-500">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-neutral-900 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
