// src/components/ui/SocialButton.tsx
import type { ComponentPropsWithRef, ReactNode } from 'react'

interface SocialButtonProps extends ComponentPropsWithRef<'button'> {
  icon: ReactNode
  label: string
}

// Botón social contorneado (Google/Facebook/Apple). Hoy es DECORATIVO:
// disabled + title. Se activará cuando el backend implemente OAuth —
// la UI ya está lista para él.
export function SocialButton({ icon, label, className, ...rest }: SocialButtonProps) {
  return (
    <button
      type="button"
      title="Próximamente"
      aria-label={label}
      disabled
      className={`flex h-11 w-full items-center justify-center rounded-lg border border-neutral-200 bg-white shadow-sm transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed ${className ?? ''}`}
      {...rest}
    >
      <span className="[&_svg]:size-5">{icon}</span>
    </button>
  )
}
