// src/pages/NotFoundPage.tsx
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
      <p className="text-7xl font-black text-slate-800">404</p>
      <h1 className="text-2xl font-bold">Esta página no existe</h1>
      <p className="text-slate-400">La URL que buscas no coincide con ninguna ruta.</p>
      <Link
        to="/"
        className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500"
      >
        ← Volver al inicio
      </Link>
    </main>
  )
}