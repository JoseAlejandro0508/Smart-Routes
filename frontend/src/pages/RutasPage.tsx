// src/pages/RutasPage.tsx — pantalla provisional (sección real en su micropaso)
import { Route } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'

// Rutas: generación automática a partir de pedidos seleccionados con
// criterios de equilibrio parametrizados, validación del supervisor y
// ejecución por los repartidores.
export function RutasPage() {
  return (
    <EmptyState
      icon={Route}
      titulo="Rutas de reparto"
      descripcion="Generación automática de rutas a partir de pedidos seleccionados, con criterios de equilibrio parametrizados. El coordinador crea, el supervisor revisa y aprueba, el repartidor ejecuta."
    />
  )
}
