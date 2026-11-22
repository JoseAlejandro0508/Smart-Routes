// src/components/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  // Fase de RENDER: debe ser PURA. Recibe el error y devuelve el estado
  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  // Fase de EFECTOS: aquí van los efectos secundarios (logging)
  componentDidCatch(error: Error, info: ErrorInfo) {
    // En producción: reportar a un servicio (Sentry, etc.)
    console.error('💥 Error capturado por el boundary:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-slate-100">
          <p className="text-6xl">💥</p>
          <h1 className="text-2xl font-bold">Algo se rompió</h1>
          <p className="max-w-md text-center text-sm text-slate-400">
            {this.state.error.message}
          </p>
          <button
            onClick={() => {
              this.setState({ error: null })
              window.location.assign('/')
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500"
          >
            Recargar la aplicación
          </button>
        </main>
      )
    }
    return this.props.children
  }
}