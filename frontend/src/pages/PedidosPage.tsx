// src/pages/PedidosPage.tsx — pantalla provisional (sección real en su micropaso)
import { Package } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'

// Banco de pedidos: registrar pedidos y paradas, clasificarlos por zona
// y tipo de entrega (paquetería, documentos, perecederos) y asignar
// prioridad (baja, media, urgente). El coordinador edita; el resto consulta.
export function PedidosPage() {
  return (
    <EmptyState
      icon={Package}
      titulo="Banco de pedidos"
      descripcion="Aquí se registrarán los pedidos y paradas, clasificados por zona, tipo de entrega y nivel de prioridad. El coordinador logístico los crea y los clasifica; el resto consulta."
    />
  )
}
