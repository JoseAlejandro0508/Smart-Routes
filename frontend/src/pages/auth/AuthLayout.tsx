// src/pages/auth/AuthLayout.tsx — el "molde" de todas las pantallas de auth
import { useRef } from 'react'
import type { FocusEvent } from 'react'
import { Outlet } from 'react-router-dom'
import { AuthIllustration } from '../../components/AuthIllustration'

// Layout partido estilo shadcn: franja ilustrada (arriba en móvil,
// columna izquierda en escritorio) + tarjeta de formulario.
//
// Además implementa el comportamiento "ojos tapados" para TODAS las
// páginas de auth por delegación: React normaliza onFocus/onBlur a
// focusin/focusout (eventos que SÍ burbujean), así que un solo handler
// en el contenedor detecta cuando el foco cae en cualquier
// input[type=password] de cualquier hijo → data-eyes="cover" → el CSS
// cierra los ojos de la ilustración. Las páginas no saben nada de esto.
export function AuthLayout() {
  const cardRef = useRef<HTMLDivElement | null>(null)

  function esPassword(target: EventTarget | null): boolean {
    return target instanceof HTMLInputElement && target.type === 'password'
  }

  function handleFocus(e: FocusEvent<HTMLDivElement>) {
    if (esPassword(e.target)) cardRef.current?.setAttribute('data-eyes', 'cover')
  }

  function handleBlur(e: FocusEvent<HTMLDivElement>) {
    if (esPassword(e.target)) cardRef.current?.removeAttribute('data-eyes')
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-4 sm:p-6 lg:p-10">
      <div
        ref={cardRef}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-neutral-200 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-2"
      >
        {/* Ilustración: franja compacta arriba en móvil (h-60/h-72 para que
            la banda del viewBox quepa entera), columna en escritorio */}
        <div className="h-60 border-b border-neutral-100 sm:h-72 lg:h-auto lg:border-b-0">
          <AuthIllustration />
        </div>
        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  )
}
