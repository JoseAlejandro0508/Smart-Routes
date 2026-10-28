// src/components/ui/TextField.tsx
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react'
import type { FieldError } from 'react-hook-form'

interface TextFieldProps extends ComponentPropsWithRef<'input'> {
  label: string
  error?: FieldError
  hint?: string
  // Icono dentro del input (lado izquierdo): <Mail />, <Lock />...
  leadingIcon?: ReactNode
  // Elemento flotante en el lado derecho (ej. botón mostrar/ocultar)
  trailing?: ReactNode
}

export function TextField({
  label,
  error,
  hint,
  leadingIcon,
  trailing,
  className,
  ...rest
}: TextFieldProps) {
  // useId: id único y ESTABLE por instancia (nada de colisiones
  // ni ids escritos a mano). Además es seguro con SSR.
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-neutral-400 [&_svg]:size-4">
            {leadingIcon}
          </span>
        )}
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`h-11 w-full rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 shadow-sm transition placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-4 ${
            leadingIcon ? 'pl-10' : 'px-3.5'
          } ${trailing ? 'pr-10' : ''} ${
            error
              ? 'border-rose-400 focus-visible:border-rose-500 focus-visible:ring-rose-500/10'
              : 'focus-visible:border-neutral-500 focus-visible:ring-neutral-900/5'
          } ${className ?? ''}`}
          {...rest}
        />
        {trailing && (
          <span className="absolute top-1/2 right-1.5 -translate-y-1/2">{trailing}</span>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-neutral-400">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-rose-600">
          {error.message}
        </p>
      )}
    </div>
  )
}
