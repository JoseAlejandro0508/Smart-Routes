// src/pages/RepartidoresPage.tsx — pantalla provisional (solo admin)
import { Truck } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'

// Gestión de repartidores: alta, flota a la que pertenecen y centros
// de distribución donde están asignados.
export function RepartidoresPage() {
  return (
    <EmptyState
      icon={Truck}
      titulo="Repartidores y flotas"
      descripcion="Alta y gestión de repartidores: flota a la que pertenecen, centros de distribución donde están asignados y su disponibilidad durante la jornada."
    />
  )
}
