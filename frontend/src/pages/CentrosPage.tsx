// src/pages/CentrosPage.tsx — pantalla provisional (solo admin)
import { Warehouse } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'

// Centros de distribución: identificador único, nombre, programa
// logístico y la lista de zonas a cubrir en la operación.
export function CentrosPage() {
  return (
    <EmptyState
      icon={Warehouse}
      titulo="Centros de distribución"
      descripcion="Administración de los centros de distribución: nombre, programa logístico al que corresponde y la lista de zonas a cubrir a lo largo de la operación."
    />
  )
}
