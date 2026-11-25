import type { DeliveryPersonSummary } from '../../api/admin.api'
import type { BalanceCriterion } from '../../api/balance-criteria.api'
import type { DistributionCenter, Zone } from '../../api/centers.api'
import type { Order } from '../../api/orders.api'
import type { Route } from '../../api/routes.api'
import type { Stop } from '../../api/stops.api'

/** Revisión vigente de una ruta; la ausencia de entrada equivale a pendiente. */
export type TestReviewDecision = 'Approved' | 'Rejected'

export interface TestDatabase {
  stops: Stop[]
  orders: Order[]
  routes: Route[]
  reviews: Record<number, TestReviewDecision>
  zones: Zone[]
  centers: DistributionCenter[]
  criteria: BalanceCriterion[]
  deliveryPersons: DeliveryPersonSummary[]
  nextStopId: number
  nextOrderId: number
  nextRouteId: number
}

function seed(): TestDatabase {
  const zones: Zone[] = [
    { id: 1, name: 'Centro' },
    { id: 2, name: 'Vedado' },
    { id: 3, name: 'Plaza' },
  ]

  const stops: Stop[] = [
    { id: 1, address: 'Calle 23 #456', zoneId: 1, zoneName: 'Centro', latitude: 23.136, longitude: -82.381 },
    { id: 2, address: 'Avenida 5ta #120', zoneId: 2, zoneName: 'Vedado', latitude: 23.128, longitude: -82.389 },
    { id: 3, address: 'Calle 12 #78', zoneId: 3, zoneName: 'Plaza', latitude: 23.125, longitude: -82.395 },
  ]

  const orders: Order[] = [
    {
      id: 1001,
      description: 'Paquete de repuestos',
      deliveryType: 'Parcel',
      priority: 'Urgent',
      weightKg: 4.5,
      entryDate: '2026-11-01',
      deadlineAt: '2026-11-01T14:00:00Z',
      status: 'Pending',
      distributionCenterId: 1,
      stopId: 1,
      centerName: 'Centro Habana',
      zoneName: 'Centro',
      address: 'Calle 23 #456',
    },
    {
      id: 1002,
      description: 'Documentos de contrato',
      deliveryType: 'Documents',
      priority: 'Medium',
      weightKg: 0.3,
      entryDate: '2026-11-01',
      deadlineAt: '2026-11-01T16:30:00Z',
      status: 'InRoute',
      distributionCenterId: 1,
      stopId: 2,
      centerName: 'Centro Habana',
      zoneName: 'Vedado',
      address: 'Avenida 5ta #120',
    },
    {
      id: 1003,
      description: 'Productos refrigerados',
      deliveryType: 'Perishable',
      priority: 'Urgent',
      weightKg: 8.2,
      entryDate: '2026-11-01',
      deadlineAt: '2026-11-01T12:00:00Z',
      status: 'Pending',
      distributionCenterId: 1,
      stopId: 3,
      centerName: 'Centro Habana',
      zoneName: 'Plaza',
      address: 'Calle 12 #78',
    },
  ]

  const criteria: BalanceCriterion[] = [
    {
      id: 1,
      name: 'Equilibrio base',
      description: 'Distribución equilibrada de carga y pedidos',
      authorCoordinatorId: null,
      isPredefined: true,
      parameters: [
        {
          id: 1,
          name: 'Máx. pedidos',
          metric: 'OrderCount',
          operator: 'LessThanOrEqual',
          appliedValue: 20,
          targetDeliveryType: null,
          balanceCriterionId: 1,
        },
        {
          id: 2,
          name: 'Peso total',
          metric: 'TotalWeight',
          operator: 'LessThanOrEqual',
          appliedValue: 80,
          targetDeliveryType: null,
          balanceCriterionId: 1,
        },
      ],
    },
  ]

  const routes: Route[] = [
    {
      id: 201,
      scheduledDate: '2026-11-01T08:00:00Z',
      generatorCoordinatorId: '11111111-1111-1111-1111-111111111111',
      distributionCenterId: 1,
      deliveryPersonId: '22222222-2222-2222-2222-222222222222',
      balanceCriterionId: 1,
      created: '2026-10-31T16:20:00Z',
      ordersOrdered: [
        {
          id: 1001,
          description: 'Paquete de repuestos',
          deliveryType: 'Parcel',
          priority: 'Urgent',
          weightKg: 4.5,
          deadlineAt: '2026-11-01T14:00:00Z',
          status: 'Pending',
          stopId: 1,
          stopAddress: 'Calle 23 #456',
        },
        {
          id: 1003,
          description: 'Productos refrigerados',
          deliveryType: 'Perishable',
          priority: 'Urgent',
          weightKg: 8.2,
          deadlineAt: '2026-11-01T12:00:00Z',
          status: 'Pending',
          stopId: 3,
          stopAddress: 'Calle 12 #78',
        },
      ],
      balanceCriterion: criteria[0],
    },
    {
      id: 202,
      scheduledDate: '2026-10-31T08:00:00Z',
      generatorCoordinatorId: '11111111-1111-1111-1111-111111111111',
      distributionCenterId: 1,
      deliveryPersonId: '22222222-2222-2222-2222-222222222222',
      balanceCriterionId: 1,
      created: '2026-10-30T15:05:00Z',
      ordersOrdered: [
        {
          id: 1002,
          description: 'Documentos de contrato',
          deliveryType: 'Documents',
          priority: 'Medium',
          weightKg: 0.3,
          deadlineAt: '2026-11-01T16:30:00Z',
          status: 'InRoute',
          stopId: 2,
          stopAddress: 'Avenida 5ta #120',
        },
      ],
      balanceCriterion: criteria[0],
    },
  ]

  return {
    stops,
    orders,
    routes,
    reviews: { 202: 'Approved' },
    zones,
    centers: [
      {
        id: 1,
        name: 'Centro Habana',
        logisticsProgram: 'Programa urbano',
        latitude: 23.132,
        longitude: -82.374,
        coveredZoneIds: [1, 2, 3],
      },
    ],
    criteria,
    deliveryPersons: [
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'marco@demo.dev',
        name: 'Marco Demo',
        dateOfBirth: '1995-05-20',
        fleet: 'Flota Centro',
      },
    ],
    nextStopId: 4,
    nextOrderId: 1004,
    nextRouteId: 203,
  }
}

/** Base de datos efímera compartida por los handlers de prueba. */
export const testDb = seed()

/** Restaura la base de datos a su estado inicial entre pruebas. */
export function resetTestDb() {
  const initial = seed()
  testDb.stops = initial.stops
  testDb.orders = initial.orders
  testDb.routes = initial.routes
  testDb.reviews = initial.reviews
  testDb.zones = initial.zones
  testDb.centers = initial.centers
  testDb.criteria = initial.criteria
  testDb.deliveryPersons = initial.deliveryPersons
  testDb.nextStopId = initial.nextStopId
  testDb.nextOrderId = initial.nextOrderId
  testDb.nextRouteId = initial.nextRouteId
}
