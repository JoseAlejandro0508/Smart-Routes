// src/components/ui/PrimaryButton.tsx
import type { ComponentPropsWithRef } from 'react'

interface PrimaryButtonProps extends ComponentPropsWithRef<'button'> {
  // Azúcar opcional: mientras loading sea true, el botón queda
  // deshabilitado (defensa extra contra doble submit)
  loading?: boolean
}

// Botón primario del sistema de diseño (look shadcn): sólido neutro
// oscuro, focus ring visible y estados disabled claros.
export function PrimaryButton({
  loading,
  className,
  disabled,
  type = 'submit',
  children,
  ...rest
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex h-11 w-full items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/10 disabled:pointer-events-none disabled:opacity-50 ${
        className ?? ''
      }`}
      {...rest}
    >
      {children}
    </button>
  )
}
