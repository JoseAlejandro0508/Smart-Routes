// src/components/ui/Toast.tsx
import { createContext, useCallback, useContext, useState } from 'react'

interface Toast {
  id: number
  message: string
  tone: 'success' | 'error'
}

// El contexto expone UNA función: notify(mensaje, tono)
const ToastContext = createContext<(message: string, tone?: Toast['tone']) => void>(
  () => {}, // valor por defecto seguro: no-op si falta el provider
)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, tone }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <p
            key={t.id}
            role="status"
            className={`rounded-lg px-4 py-3 text-sm shadow-xl ring-1 ${
              t.tone === 'success'
                ? 'bg-emerald-950 text-emerald-300 ring-emerald-800'
                : 'bg-rose-950 text-rose-300 ring-rose-800'
            }`}
          >
            {t.tone === 'success' ? '✅ ' : '⚠️ '}
            {t.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}