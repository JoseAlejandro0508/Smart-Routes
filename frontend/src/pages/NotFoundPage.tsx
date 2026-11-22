// src/pages/NotFoundPage.tsx
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-7xl font-black text-neutral-200">404</p>
      <h1 className="text-2xl font-bold text-neutral-900">Esta página no existe</h1>
      <p className="text-neutral-500">La URL que buscas no coincide con ninguna ruta.</p>
      <Link
        to="/"
        className="rounded-lg bg-neutral-900 px-4 py-2 font-semibold text-white hover:bg-neutral-700"
      >
        Volver al inicio
      </Link>
    </main>
  )
}