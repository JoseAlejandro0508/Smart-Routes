import type { OrderSummary } from '../api/orders.api'
import type { RouteSummary } from '../api/routes.api'
import type { AssignedRoute } from '../api/deliveries.api'
import type { ReschedulingRequest } from '../api/reschedulings.api'
import type { AdminUserRole } from '../api/admin.api'
import type { ReportData, ReportId } from '../api/reports.api'

export const mockState = {
  // Pedidos 
  orders: [
    { id: 1001, description: 'Paquete de repuestos', deliveryType: 'Parcel', priority: 'Urgent', weightKg: 4.5, entryDate: '2026-11-01', deadlineAt: '2026-11-01T14:00:00Z', status: 'Pending', centerName: 'Centro Habana', zoneName: 'Centro', address: 'Calle 23 #456' },
    { id: 1002, description: 'Documentos de contrato', deliveryType: 'Documents', priority: 'Medium', weightKg: 0.3, entryDate: '2026-11-01', deadlineAt: '2026-11-01T16:30:00Z', status: 'InRoute', centerName: 'Centro Habana', zoneName: 'Vedado', address: 'Avenida 5ta #120' },
    { id: 1003, description: 'Productos refrigerados', deliveryType: 'Perishable', priority: 'Urgent', weightKg: 8.2, entryDate: '2026-11-01', deadlineAt: '2026-11-01T12:00:00Z', status: 'Pending', centerName: 'Centro Habana', zoneName: 'Plaza', address: 'Calle 12 #78' },
  ] as OrderSummary[],
  nextOrderId: 1004,

  // Rutas
  routes: [
    {
      id: 201, creationDate: '2026-10-31T16:20:00Z', scheduledDate: '2026-11-01', vehicleCapacityKg: 80,
      generatorName: 'Ana Demo', centerName: 'Centro Habana', status: 'PendingApproval', orderCount: 18, stopCount: 12,
      parameters: [{ label: 'Proporción de tipo', value: '40% paquetería / 30% documentos / 30% perecederos' }, { label: 'Cobertura de zonas', value: '4 zonas' }, { label: 'Peso total', value: '62.4 kg' }],
    },
    {
      id: 202, creationDate: '2026-10-30T15:05:00Z', scheduledDate: '2026-10-31', vehicleCapacityKg: 100,
      generatorName: 'Ana Demo', centerName: 'Centro Habana', status: 'Approved', orderCount: 24, stopCount: 15, deliveryPersonName: 'Marco Demo',
      parameters: [{ label: 'Proporción de tipo', value: '50% paquetería / 25% documentos / 25% perecederos' }, { label: 'Cobertura de zonas', value: '5 zonas' }, { label: 'Peso total', value: '78.1 kg' }],
    },
    {
      id: 203, creationDate: '2026-10-29T13:40:00Z', scheduledDate: '2026-10-30', vehicleCapacityKg: 60,
      generatorName: 'Ana Demo', centerName: 'Centro Vedado', status: 'Rejected', orderCount: 12, stopCount: 9,
      parameters: [{ label: 'Proporción de tipo', value: '60% paquetería / 20% documentos / 20% perecederos' }, { label: 'Cobertura de zonas', value: '3 zonas' }, { label: 'Peso total', value: '59.7 kg' }],
    },
  ] as RouteSummary[],
  nextRouteId: 204,

  // Rutas asignadas al repartidor ────────────────────────────────────
  assignedRoutes: [
    {
      routeId: 202,
      scheduledDate: '2026-10-31',
      centerName: 'Centro Habana',
      stops: [
        { orderId: 1001, description: 'Paquete de repuestos', address: 'Calle 23 #456', zoneName: 'Centro', priority: 'Urgent', result: 'Pending' },
        { orderId: 1002, description: 'Documentos de contrato', address: 'Avenida 5ta #120', zoneName: 'Vedado', priority: 'Medium', result: 'Successful', observations: 'Recibido en recepción' },
        { orderId: 1003, description: 'Productos refrigerados', address: 'Calle 12 #78', zoneName: 'Plaza', priority: 'Urgent', result: 'Pending' },
      ],
    },
  ] as AssignedRoute[],

  // Reprogramaciones
  reschedulings: [] as ReschedulingRequest[],
  nextReschedulingId: 1,

  // Administración de roles
  adminUsers: [
    { id: 'usr_01', name: 'Ana Demo', email: 'ana@demo.dev', role: 'LogisticsCoordinator' },
    { id: 'usr_02', name: 'Carlos Demo', email: 'carlos@demo.dev', role: 'Administrator' },
    { id: 'usr_03', name: 'Sofía Demo', email: 'sofia@demo.dev', role: 'OperationsSupervisor' },
    { id: 'usr_04', name: 'Marco Demo', email: 'marco@demo.dev', role: 'DeliveryPerson' },
  ] as AdminUserRole[],

  // Reportes
  reports: {
    'generated-routes': { id: 'generated-routes', title: 'Rutas generadas por centro', description: 'Rutas automáticas, creador, fecha y parámetros usados.', columns: ['Centro', 'Ruta', 'Creador', 'Fecha', 'Parámetros'], rows: [{ Centro: 'Centro Habana', Ruta: '#201', Creador: 'Ana Demo', Fecha: '01/11/2026', Parámetros: 'Zonas + tipo + peso' }, { Centro: 'Centro Habana', Ruta: '#202', Creador: 'Ana Demo', Fecha: '31/10/2026', Parámetros: 'Tipo + capacidad' }, { Centro: 'Centro Vedado', Ruta: '#203', Creador: 'Ana Demo', Fecha: '30/10/2026', Parámetros: 'Zonas + pedidos' }] },
    'managed-orders': { id: 'managed-orders', title: 'Pedidos más gestionados', description: 'Pedidos finales clasificados por prioridad y zona.', columns: ['Pedido', 'Zona', 'Prioridad', 'Veces gestionado'], rows: [{ Pedido: '#1001', Zona: 'Centro', Prioridad: 'Urgente', 'Veces gestionado': 8 }, { Pedido: '#1003', Zona: 'Plaza', Prioridad: 'Urgente', 'Veces gestionado': 6 }, { Pedido: '#1002', Zona: 'Vedado', Prioridad: 'Media', 'Veces gestionado': 4 }] },
    'validated-routes': { id: 'validated-routes', title: 'Rutas validadas por revisor', description: 'Decisiones, fechas y observaciones de supervisión.', columns: ['Revisor', 'Ruta', 'Decisión', 'Fecha', 'Observaciones'], rows: [{ Revisor: 'Sofía Demo', Ruta: '#202', Decisión: 'Aprobada', Fecha: '31/10/2026', Observaciones: 'Criterios cumplidos' }, { Revisor: 'Sofía Demo', Ruta: '#203', Decisión: 'Rechazada', Fecha: '30/10/2026', Observaciones: 'Revisar cobertura' }] },
    'delivery-performance': { id: 'delivery-performance', title: 'Desempeño de repartidores', description: 'Tasas de entrega a tiempo clasificadas por prioridad.', columns: ['Repartidor', 'Ruta', 'Urgentes a tiempo', 'Medias a tiempo', 'Total'], rows: [{ Repartidor: 'Marco Demo', Ruta: '#202', 'Urgentes a tiempo': '92%', 'Medias a tiempo': '100%', Total: '95%' }, { Repartidor: 'Luis Demo', Ruta: '#204', 'Urgentes a tiempo': '84%', 'Medias a tiempo': '90%', Total: '87%' }] },
    'center-comparison': { id: 'center-comparison', title: 'Comparación entre centros', description: 'Distribución de pedidos y cumplimiento de criterios.', columns: ['Centro', 'Pedidos', 'Zonas', 'Prioridad urgente', 'Criterios cumplidos'], rows: [{ Centro: 'Centro Habana', Pedidos: 128, Zonas: 6, 'Prioridad urgente': '31%', 'Criterios cumplidos': 'Sí' }, { Centro: 'Centro Vedado', Pedidos: 94, Zonas: 4, 'Prioridad urgente': '27%', 'Criterios cumplidos': 'Sí' }] },
    'priority-correlation': { id: 'priority-correlation', title: 'Prioridad y rendimiento', description: 'Correlación entre prioridad, incumplimientos y rendimiento por centro.', columns: ['Centro', 'Correlación', 'Incumplimiento', 'Coordinador', 'Flota comparada'], rows: [{ Centro: 'Centro Habana', Correlación: '0.72', Incumplimiento: '12%', Coordinador: 'Ana Demo', 'Flota comparada': 'Flota Norte' }, { Centro: 'Centro Vedado', Correlación: '0.64', Incumplimiento: '16%', Coordinador: 'Ana Demo', 'Flota comparada': 'Flota Centro' }] },
  } as Record<ReportId, ReportData>,
}