// src/pages/auth/ForgotPasswordPage.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Mail, MailCheck } from 'lucide-react'
import { forgotSchema, type ForgotValues } from '../../features/auth/schemas'
import { authApi } from '../../api/auth.api'
import { getApiErrorMessage } from '../../api/http'
import { TextField } from '../../components/ui/TextField'
import { PrimaryButton } from '../../components/ui/PrimaryButton'

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotValues) {
    try {
      await authApi.forgot(values.email)
      // Confirmación genérica SIEMPRE, exista o no el correo
      // (si dijéramos "ese correo no existe", filtraríamos la db)
      setSentTo(values.email)
    } catch (err) {
      setError('root.server', { message: getApiErrorMessage(err) })
    }
  }

  // Pantalla 2: confirmación
  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <MailCheck size={28} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Revisa tu correo
        </h1>
        <p className="text-sm text-neutral-500">
          Si <span className="font-medium text-neutral-900">{sentTo}</span> está
          registrado, te enviamos un enlace para restablecer la contraseña.
        </p>
        <p className="text-xs text-neutral-400">
          En esta demo, tu "bandeja de entrada" es la consola del navegador:
          busca el mensaje con el enlace.
        </p>
        <Link
          to="/login"
          className="mt-2 text-sm font-medium text-neutral-900 hover:underline"
        >
          ← Volver al login
        </Link>
      </div>
    )
  }

  // Pantalla 1: pedir el email
  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Escribe tu correo y te enviaremos un enlace para crear una nueva.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <TextField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="correo@demo.dev"
          leadingIcon={<Mail size={16} />}
          error={errors.email}
          {...register('email')}
        />

        {errors.root?.server && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {errors.root.server.message}
          </p>
        )}

        <PrimaryButton loading={isSubmitting}>
          {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
        </PrimaryButton>
      </form>

      <p className="text-center text-sm text-neutral-500">
        <Link to="/login" className="font-medium text-neutral-900 hover:underline">
          ← Volver al login
        </Link>
      </p>
    </div>
  )
}
