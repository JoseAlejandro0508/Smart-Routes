import type { Order } from '../api/orders.api'
import type { AssignedRoute } from '../api/deliveries.api'
import type { ReschedulingRequest } from '../api/reschedulings.api'
import type { AdminUser } from '../api/admin.api'
import type { ReportData, ReportId } from '../api/reports.api'
import type { Stop } from '../api/stops.api'

export const mockState = {
  // Paradas registradas
  stops: [
    { id: 1, address: 'Calle 23 #456', zoneId: 1, zoneName: 'Centro' },
    { id: 2, address: 'Avenida 5ta #120', zoneId: 2, zoneName: 'Vedado' },
    { id: 3, address: 'Calle 12 #78', zoneId: 3, zoneName: 'Plaza' },
  ] as Stop[],
  nextStopId: 4,

  // Pedidos 
  orders: [
    { id: 1001, description: 'Paquete de repuestos', deliveryType: 'Parcel', priority: 'Urgent', weightKg: 4.5, entryDate: '2026-11-01', deadlineAt: '2026-11-01T14:00:00Z', status: 'Pending', distributionCenterId: 1, stopId: 1, centerName: 'Centro Habana', zoneName: 'Centro', address: 'Calle 23 #456' },
    { id: 1002, description: 'Documentos de contrato', deliveryType: 'Documents', priority: 'Medium', weightKg: 0.3, entryDate: '2026-11-01', deadlineAt: '2026-11-01T16:30:00Z', status: 'InRoute', distributionCenterId: 1, stopId: 2, centerName: 'Centro Habana', zoneName: 'Vedado', address: 'Avenida 5ta #120' },
    { id: 1003, description: 'Productos refrigerados', deliveryType: 'Perishable', priority: 'Urgent', weightKg: 8.2, entryDate: '2026-11-01', deadlineAt: '2026-11-01T12:00:00Z', status: 'Pending', distributionCenterId: 1, stopId: 3, centerName: 'Centro Habana', zoneName: 'Plaza', address: 'Calle 12 #78' },
  ] as Order[],
  nextOrderId: 1004,

  // Rutas
  routes: [
    {
      id: 201,
      scheduledDate: '2026-11-01T08:00:00Z',
      generatorCoordinatorId: 'usr_01',
      distributionCenterId: 1,
      deliveryPersonId: 'usr_04',
      balanceCriterionId: 1,
      created: '2026-10-31T16:20:00Z',
      ordersOrdered: [
        { id: 1001, description: 'Paquete de repuestos', deliveryType: 'Parcel', priority: 'Urgent', weightKg: 4.5, deadlineAt: '2026-11-01T14:00:00Z', status: 'Pending', stopId: 1, stopAddress: 'Calle 23 #456' },
        { id: 1003, description: 'Productos refrigerados', deliveryType: 'Perishable', priority: 'Urgent', weightKg: 8.2, deadlineAt: '2026-11-01T12:00:00Z', status: 'Pending', stopId: 3, stopAddress: 'Calle 12 #78' },
      ],
      balanceCriterion: {
        id: 1,
        name: 'Equilibrio base',
        description: 'Distribución equilibrada de carga y pedidos',
        authorCoordinatorId: null,
        isPredefined: true,
        parameters: [
          { id: 1, name: 'Máx. pedidos', metric: 'OrderCount', operator: 'LessThanOrEqual', appliedValue: 20, targetDeliveryType: null, balanceCriterionId: 1 },
          { id: 2, name: 'Peso total', metric: 'TotalWeight', operator: 'LessThanOrEqual', appliedValue: 80, targetDeliveryType: null, balanceCriterionId: 1 },
        ],
      },
    },
    {
      id: 202,
      scheduledDate: '2026-10-31T08:00:00Z',
      generatorCoordinatorId: 'usr_01',
      distributionCenterId: 1,
      deliveryPersonId: 'usr_04',
      balanceCriterionId: 1,
      created: '2026-10-30T15:05:00Z',
      ordersOrdered: [
        { id: 1002, description: 'Documentos de contrato', deliveryType: 'Documents', priority: 'Medium', weightKg: 0.3, deadlineAt: '2026-11-01T16:30:00Z', status: 'InRoute', stopId: 2, stopAddress: 'Avenida 5ta #120' },
      ],
      balanceCriterion: {
        id: 1,
        name: 'Equilibrio base',
        description: 'Distribución equilibrada de carga y pedidos',
        authorCoordinatorId: null,
        isPredefined: true,
        parameters: [
          { id: 1, name: 'Máx. pedidos', metric: 'OrderCount', operator: 'LessThanOrEqual', appliedValue: 20, targetDeliveryType: null, balanceCriterionId: 1 },
        ],
      },
    },
  ] as any[],
  nextRouteId: 203,
  routeReviews: {
    201: 'Pending',
    202: 'Approved',
  } as Record<number, 'Pending' | 'Approved' | 'Rejected'>,

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
    { id: 'usr_01', name: 'Ana Demo', email: 'ana@demo.dev', role: 'LogisticsCoordinator', active: true },
    { id: 'usr_02', name: 'Carlos Demo', email: 'carlos@demo.dev', role: 'Administrator', active: true },
    { id: 'usr_03', name: 'Sofía Demo', email: 'sofia@demo.dev', role: 'OperationsSupervisor', active: true },
    { id: 'usr_04', name: 'Marco Demo', email: 'marco@demo.dev', role: 'DeliveryPerson', active: true },
  ] as AdminUser[],

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