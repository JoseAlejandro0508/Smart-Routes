// src/components/ui/EmptyState.tsx
// Estado vacío elegante para secciones en construcción: mantiene la
// navegación REAL desde el día 1 mientras el contenido llega por
// micropasos. Cada página futura reutiliza este componente.
import type { ComponentType } from 'react'

export function EmptyState({
  icon: Icon,
  titulo,
  descripcion,
  chip = 'Sección en construcción',
}: {
  icon: ComponentType<{ className?: string }>
  titulo: string
  descripcion: string
  chip?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
        <Icon className="h-7 w-7 text-neutral-400" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-neutral-900">{titulo}</h2>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-neutral-500">{descripcion}</p>
      {chip && (
        <span className="mt-5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
          {chip}
        </span>
      )}
    </div>
  )
}
