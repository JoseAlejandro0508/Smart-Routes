// src/pages/ReportesPage.tsx — pantalla provisional (sección real en su micropaso)
import { BarChart3 } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'

// Reportes: los 6 reportes del enunciado (tablas y gráficos), con
// exportación a PDF para todo usuario y ordenamiento por columnas.
export function ReportesPage() {
  return (
    <EmptyState
      icon={BarChart3}
      titulo="Reportes"
      descripcion="Los 6 reportes del sistema: rutas generadas, pedidos más gestionados, rutas validadas, desempeño de repartidores, comparación entre centros y correlación prioridad-rendimiento. Con exportación a PDF y ordenamiento por columnas."
    />
  )
}
