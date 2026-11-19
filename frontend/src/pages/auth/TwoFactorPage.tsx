// src/pages/auth/TwoFactorPage.tsx
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider'
import { getApiErrorMessage } from '../../api/http'
import { authApi } from '../../api/auth.api'
import { useToast } from '../../components/ui/Toast'
import { PrimaryButton } from '../../components/ui/PrimaryButton'

const LENGTH = 6

export function TwoFactorPage() {
  const { verify2FA } = useAuth()
  const notify = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // El reto viajó desde el login en el state de navegación.
  const challengeToken =
    (location.state as { challengeToken?: string } | null)?.challengeToken

  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  // Defensa en profundidad: sin reto no hay nada que verificar.
  // (Alguien escribió la URL a mano → vuelta al login)
  useEffect(() => {
    if (!challengeToken) navigate('/login', { replace: true })
  }, [challengeToken, navigate])

  // Cuenta regresiva del reenvío: 1 tick por segundo hasta llegar a 0
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  async function handleResend() {
    if (!challengeToken) return
    try {
      await authApi.resend2FA(challengeToken)
      notify('Código reenviado. Mira la consola 📱')
      setResendCooldown(60)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  function handleChange(index: number, raw: string) {
    const clean = raw.replace(/\D/g, '') // solo dígitos, siempre
    if (!clean) {
      const next = [...digits]
      next[index] = ''
      setDigits(next)
      return
    }
    if (clean.length === 1) {
      // Escritura normal: guarda y salta a la siguiente celda
      const next = [...digits]
      next[index] = clean
      setDigits(next)
      inputsRef.current[index + 1]?.focus()
    } else {
      // Pegaron el código completo: repártelo desde esta celda
      const next = [...digits]
      clean.split('').forEach((d, offset) => {
        if (index + offset < LENGTH) next[index + offset] = d
      })
      setDigits(next)
      const focusAt = Math.min(index + clean.length, LENGTH - 1)
      inputsRef.current[focusAt]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    // Backspace en celda vacía → retrocede borrando la anterior
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits]
      next[index - 1] = ''
      setDigits(next)
      inputsRef.current[index - 1]?.focus()
      e.preventDefault()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = digits.join('')
    if (!/^\d{6}$/.test(code)) {
      setError('El código debe tener exactamente 6 dígitos')
      return
    }
    if (!challengeToken) return
    setError(null)
    setIsLoading(true)
    try {
      await verify2FA(challengeToken, code)
      navigate('/', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err)) // p. ej. "Código incorrecto o expirado"
      // Limpieza total para reintentar: celdas vacías y foco al inicio
      setDigits(Array(LENGTH).fill(''))
      inputsRef.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Verificación en dos pasos
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Introduce el código de 6 dígitos. En esta demo, míralo en la consola
          del navegador (<code className="text-neutral-700">📱 [MOCK]</code>).
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex justify-between gap-2">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el }}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              aria-label={`Dígito ${i + 1} del código`}
              inputMode="numeric"            // teclado numérico en móvil
              autoComplete="one-time-code"   // el navegador sugiere el código SMS
              maxLength={i === 0 ? LENGTH : 1} // la 1ª celda acepta el pegado completo
              className="h-12 w-11 rounded-lg border border-neutral-200 bg-white text-center text-lg font-semibold text-neutral-900 shadow-sm focus-visible:border-neutral-500 focus-visible:ring-4 focus-visible:ring-neutral-900/5 focus-visible:outline-none"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isLoading}
          className="self-start text-sm font-medium text-neutral-900 hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {resendCooldown > 0 ? `Reenviar código en ${resendCooldown}s` : 'Reenviar código'}
        </button>

        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {error}
          </p>
        )}

        <PrimaryButton loading={isLoading}>
          {isLoading ? 'Verificando…' : 'Verificar código'}
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
