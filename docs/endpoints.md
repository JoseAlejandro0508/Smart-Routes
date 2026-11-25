# Contrato de API — Smart Routes

| Metadato | Valor |
|---|---|
| Versión | 1.0 |
| Estado | Verificado contra el código fuente |
| Backend de referencia | `develop@2831109` (2026-11-22) |
| Fecha de revisión | 2026-11-25 |
| Fuentes | `src/Web/Endpoints`, `src/Application`, `src/Domain` |
| Ámbito | API de producto; excluye endpoints de plantilla |
| Documento relacionado | [`frontend/tasklist.md`](../frontend/tasklist.md) |

## Resumen

- El backend expone **56 endpoints de producto**.
- La autenticación usa **JWT Bearer**: access token de 15 minutos y refresh token de 7 días con rotación.
- Los enums se serializan como texto; los errores usan `ProblemDetails`.
- Faltan **tres capacidades** que el frontend ya consume o necesita: dashboard, reportes y clasificación de pedidos.
- Los mayores riesgos de integración son: permisos de centros/zonas, estado de revisión de rutas, forma de la lista de pedidos y el campo `balanceCritertiaId`.
- Los detalles de implementación y las brechas se documentan en las secciones [16](#16-hallazgos-de-integración) y [17](#17-trazabilidad).

> **Lectura rápida:** Resumen → Vista rápida → Hallazgos de severidad alta.

### Vista rápida

| Módulo | Endpoints | Estado | Observación |
|---|---:|---|---|
| Auth | 10 | Implementado | Revisar refresh y 2FA |
| Pedidos | 3 | Parcial | Lista y creación desalineadas |
| Paradas | 4 | Parcial | Crear/editar devuelve `204` |
| Rutas | 4 | Parcial | Falta estado de revisión |
| Criterios | 3 | Implementado | Revisar nombres de campos |
| Admin roles | 11 | Implementado | Faltan centros en repartidores |
| Centros | 11 | Parcial | Solo admin; alta incompleta |
| Zonas | 4 | Parcial | Solo admin |
| Entregas | 3 | Implementado | Reporte sin alcance por centro |
| Reprogramaciones | 3 | Parcial | Nombre del coordinador placeholder |
| Dashboard | 1 | No existe | Debe mostrar “Pendiente de backend” |
| Reportes | 1 | No existe | Solo existe el reporte por centro |
| Clasificación | 1 | No existe | Eliminar o implementar |

**Total implementado:** 56 endpoints de producto. **Total ausente:** 3 capacidades.

### Método de verificación

Este documento se construyó por **revisión estática** de:

1. El registro de endpoints y sus políticas de autorización.
2. Los DTO de solicitud y respuesta.
3. Los validadores y las reglas de negocio.
4. El manejador global de excepciones.

No se ejecutaron pruebas de integración contra una instancia viva. Los códigos `401`/`403` generados por el middleware pueden no incluir cuerpo; los `400`, `404` y `409` de la capa de aplicación sí devuelven `ProblemDetails`.

---

## 1. Guía de lectura

| Convención | Significado |
|---|---|
| `AUTH-01`, `ORD-02`, etc. | Identificador estable para trazabilidad |
| `Público` | No requiere token |
| `Bearer` | Requiere `Authorization: Bearer <accessToken>` |
| `Rol` | Rol mínimo requerido, además del token |
| `200`, `201`, `204` | Respuesta exitosa documentada |
| `—` | Sin cuerpo de respuesta |
| `?` | Campo o parámetro opcional |
| `string (GUID)` | Identificador de usuario |
| `Parcial` | El endpoint existe, pero el contrato tiene una limitación conocida |
| `No existe` | El frontend lo espera, pero el backend no lo implementa |

### Estados de integración

| Estado | Criterio |
|---|---|
| **Implementado** | Endpoint disponible y contrato estable |
| **Parcial** | Endpoint disponible con una brecha documentada |
| **No existe** | Capacidad ausente en el backend |

---

## 2. Convenciones

| Tema | Regla |
|---|---|
| Base URL | `/api`; el frontend usa `VITE_API_URL=/api` y Vite lo proxea |
| Formato | JSON UTF-8 (`Content-Type: application/json`) |
| Autenticación | `Authorization: Bearer <accessToken>` |
| Access token | JWT, 15 minutos por defecto |
| Refresh token | Opaco, 7 días por defecto, un solo uso y con rotación |
| IDs de entidad | Enteros |
| IDs de usuario | `string` con formato GUID |
| Fechas | `DateOnly`: `YYYY-MM-DD`; `DateTimeOffset`: ISO 8601 con zona |
| Decimales | Números JSON |
| Enums | Texto (`JsonStringEnumConverter`) |
| Rutas | ASP.NET Core no distingue mayúsculas/minúsculas |
| CORS | Cualquier origen, método y cabecera; sin credenciales |
| Paginación | Solo `GET /api/Orders`, mediante cabeceras |

### 2.1 Errores

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "Detalle opcional",
  "errors": {
    "Description": ["Description must not be empty."]
  }
}
```

| Código | Uso |
|---|---|
| `200` | Correcto con cuerpo |
| `201` | Recurso creado; incluye `Location` |
| `204` | Correcto sin cuerpo |
| `400` | Validación o regla de negocio |
| `401` | Sin autenticar o token inválido/expirado |
| `403` | Autenticado sin rol o permiso |
| `404` | Recurso inexistente |
| `409` | Conflicto con el estado actual |
| `429` | **No implementado** |
| `500` | Error no controlado |

### 2.2 Paginación

`GET /api/Orders` devuelve un **array** y expone los totales en cabeceras:

```http
X-Total-Count: 45
X-Page-Number: 2
X-Page-Size: 20
```

No hay otros endpoints paginados en el cuerpo.

### 2.3 Enums

| Enum | Valores |
|---|---|
| `DeliveryType` | `Parcel`, `Documents`, `Perishable` |
| `OrderPriority` | `Low`, `Medium`, `Urgent` |
| `OrderStatus` | `Pending`, `InRoute`, `Delivered`, `Returned` |
| `DeliveryResult` | `Successful`, `Failed` |
| `ReviewDecision` | `Pending`, `Approved`, `Rejected` |
| `BalanceMetric` | `OrderCount`, `DeliveryTypeProportion`, `ZoneCount`, `TotalWeight`, `StopCount` |
| `ComparisonOperator` | `LessThanOrEqual`, `GreaterThanOrEqual`, `Equal` |
| `ReschedulingStatus` | `Pending`, `InProgress`, `Resolved` |
| `ManualResolution` | `Reassigned`, `Rescheduled`, `ReturnedToWarehouse` |
| `UserRole` | `Administrator`, `LogisticsCoordinator`, `OperationsSupervisor`, `DeliveryPerson` |

> `ReviewDecision.Pending` no se acepta en `POST /api/routes/add-review`; solo `Approved` o `Rejected`.

---

## 3. Roles y autorización

| Rol | Responsabilidad |
|---|---|
| `Administrator` | Usuarios, centros, zonas, reportes y configuración |
| `LogisticsCoordinator` | Pedidos, rutas, criterios, reprogramaciones y reportes |
| `OperationsSupervisor` | Revisión de rutas y reportes |
| `DeliveryPerson` | Rutas asignadas, entregas y solicitudes de reprogramación |

### Matriz resumida

| Grupo | Admin | Coordinador | Supervisor | Repartidor | Público |
|---|---:|---:|---:|---:|---:|
| Auth login/register/forgot/reset/2FA/refresh |  |  |  |  | Sí |
| Auth me/logout/change-password | Sí | Sí | Sí | Sí |  |
| Pedidos |  | Sí |  |  |  |
| Paradas: listar | Sí | Sí | Sí | Sí |  |
| Paradas: escribir | Sí | Sí |  |  |  |
| Rutas: generar |  | Sí |  |  |  |
| Rutas: revisar |  |  | Sí |  |  |
| Rutas: filtrar/mapa | Sí | Sí | Sí | Sí |  |
| Criterios: listar | Sí | Sí | Sí | Sí |  |
| Criterios: escribir | Sí | Sí |  |  |  |
| Admin roles | Sí | Parcial | Parcial |  |  |
| Centros y zonas | Sí |  |  |  |  |
| Entregas: rutas/registro |  |  |  | Sí |  |
| Entregas: reporte por centro | Sí | Sí | Sí |  |  |
| Reprogramaciones: listar | Sí | Sí | Sí | Sí |  |
| Reprogramaciones: crear |  |  |  | Sí |  |
| Reprogramaciones: resolver |  | Sí |  |  |  |

> La navegación del frontend aún no coincide con esta matriz. Ver [hallazgos](#16-hallazgos-de-integración).

---

## 4. Mapa de endpoints

| ID | Método | Ruta | Rol | Éxito |
|---|---|---|---|---|
| AUTH-01 | POST | `/api/auth/login` | Público | 200 |
| AUTH-02 | POST | `/api/auth/2fa/verify` | Público | 200 |
| AUTH-03 | POST | `/api/auth/2fa/resend` | Público | 204 |
| AUTH-04 | POST | `/api/auth/refresh` | Público | 200 |
| AUTH-05 | GET | `/api/auth/me` | Bearer | 200 |
| AUTH-06 | POST | `/api/auth/logout` | Bearer | 204 |
| AUTH-07 | POST | `/api/auth/change-password` | Bearer | 204 |
| AUTH-08 | POST | `/api/auth/register` | Público | 201 |
| AUTH-09 | POST | `/api/auth/forgot` | Público | 200/204 |
| AUTH-10 | POST | `/api/auth/reset` | Público | 204 |
| ORD-01 | POST | `/api/Orders` | Coordinador | 201 |
| ORD-02 | GET | `/api/Orders` | Coordinador | 200 |
| ORD-03 | GET | `/api/Orders/{id}` | Coordinador | 200 |
| STOP-01 | GET | `/api/stops` | Bearer | 200 |
| STOP-02 | POST | `/api/stops/create-stop` | Coordinador/Admin | 204 |
| STOP-03 | PUT | `/api/stops/{stopId}` | Coordinador/Admin | 204 |
| STOP-04 | DELETE | `/api/stops/{stopId}` | Coordinador/Admin | 204 |
| ROUTE-01 | POST | `/api/routes/generate` | Coordinador | 200 |
| ROUTE-02 | POST | `/api/routes/add-review` | Supervisor | 204 |
| ROUTE-03 | GET | `/api/routes/filter` | Bearer | 200 |
| ROUTE-04 | GET | `/api/routes/{id}/map` | Bearer | 200 |
| BAL-01 | GET | `/api/balance-criteria/get-all` | Bearer | 200 |
| BAL-02 | POST | `/api/balance-criteria/create-balance-criterion` | Coordinador/Admin | 200 |
| BAL-03 | DELETE | `/api/balance-criteria/{id}` | Coordinador/Admin | 204 |
| ROLE-01 | POST | `/api/admin/manage-roles/create-delivery-person` | Admin | 204 |
| ROLE-02 | POST | `/api/admin/manage-roles/create-operations-supervisor` | Admin | 204 |
| ROLE-03 | POST | `/api/admin/manage-roles/create-logistics-cordinator` | Admin | 204 |
| ROLE-04 | POST | `/api/admin/manage-roles/create-delivery-person-full` | Admin | 201 |
| ROLE-05 | POST | `/api/admin/manage-roles/create-coordinator-full` | Admin | 201 |
| ROLE-06 | POST | `/api/admin/manage-roles/create-supervisor-full` | Admin | 201 |
| ROLE-07 | GET | `/api/admin/manage-roles/users` | Admin | 200 |
| ROLE-08 | GET | `/api/admin/manage-roles/delivery-persons` | Admin/Coord/Sup | 200 |
| ROLE-09 | GET | `/api/admin/manage-roles/coordinators` | Bearer | 200 |
| ROLE-10 | GET | `/api/admin/manage-roles/supervisors` | Admin | 200 |
| ROLE-11 | PUT | `/api/admin/manage-roles/users/{userId}/role` | Admin | 204 |
| CTR-01 | GET | `/api/admin/distribution-center/get-all` | Admin | 200 |
| CTR-02 | GET | `/api/admin/distribution-center/{id}` | Admin | 200 |
| CTR-03 | POST | `/api/admin/distribution-center/create-distribution-center` | Admin | 204 |
| CTR-04 | PUT | `/api/admin/distribution-center/{id}` | Admin | 204 |
| CTR-05 | DELETE | `/api/admin/distribution-center/{id}` | Admin | 204 |
| CTR-06 | POST | `/api/admin/distribution-center/add-covered-zone` | Admin | 204 |
| CTR-07 | DELETE | `/api/admin/distribution-center/remove-covered-zones` | Admin | 204 |
| CTR-08 | POST | `/api/admin/distribution-center/add-logistics-coordinators` | Admin | 204 |
| CTR-09 | DELETE | `/api/admin/distribution-center/remove-logistics-coordinators` | Admin | 204 |
| CTR-10 | POST | `/api/admin/distribution-center/add-delivery-persons` | Admin | 204 |
| CTR-11 | DELETE | `/api/admin/distribution-center/remove-delivery-persons` | Admin | 204 |
| ZONE-01 | GET | `/api/admin/zones/get-all` | Admin | 200 |
| ZONE-02 | POST | `/api/admin/zones/create-zone` | Admin | 204 |
| ZONE-03 | PUT | `/api/admin/zones/{zoneId}` | Admin | 204 |
| ZONE-04 | DELETE | `/api/admin/zones/{zoneId}` | Admin | 204 |
| DEL-01 | GET | `/api/delivery/routes` | Repartidor | 200 |
| DEL-02 | POST | `/api/delivery/routes/{routeId}/stops/{orderId}` | Repartidor | 200 |
| DEL-03 | GET | `/api/delivery/reports/by-center` | Admin/Coord/Sup | 200 |
| RESCH-01 | GET | `/api/reschedulings` | Bearer | 200 |
| RESCH-02 | POST | `/api/reschedulings` | Repartidor | 201 |
| RESCH-03 | POST | `/api/reschedulings/{id}/resolve` | Coordinador | 200 |

---

## 5. Auth

**Fuente:** `src/Web/Endpoints/Auth.cs`.

### 5.1 Endpoints

| ID | Método | Ruta | Auth | Éxito | Errores |
|---|---|---|---|---|---|
| AUTH-01 | POST | `/api/auth/login` | Público | 200 | 401 |
| AUTH-02 | POST | `/api/auth/2fa/verify` | Público | 200 | 401 |
| AUTH-03 | POST | `/api/auth/2fa/resend` | Público | 204 | — |
| AUTH-04 | POST | `/api/auth/refresh` | Público | 200 | 401 |
| AUTH-05 | GET | `/api/auth/me` | Bearer | 200 | 401 |
| AUTH-06 | POST | `/api/auth/logout` | Bearer | 204 | 401 |
| AUTH-07 | POST | `/api/auth/change-password` | Bearer | 204 | 400, 401 |
| AUTH-08 | POST | `/api/auth/register` | Público | 201 | 400 |
| AUTH-09 | POST | `/api/auth/forgot` | Público | 200/204 | — |
| AUTH-10 | POST | `/api/auth/reset` | Público | 204 | 400 |

### 5.2 Modelos

**`TokenPair`**

| Campo | Tipo | Descripción |
|---|---|---|
| `accessToken` | string | JWT de acceso |
| `refreshToken` | string | Token opaco de refresco |
| `expiresIn` | number | Segundos de vida del access token |
| `tokenType` | string | `Bearer` |

**`TwoFactorChallenge`**

| Campo | Tipo | Descripción |
|---|---|---|
| `requiresTwoFactor` | boolean | Siempre `true` |
| `challengeToken` | string | Token temporal de 5 minutos |

**`UserResponse`**

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string (GUID) | Identificador |
| `name` | string | Nombre visible |
| `email` | string | Correo |
| `role` | string | Primer rol asignado |

### 5.3 Solicitudes

| ID | Body |
|---|---|
| AUTH-01 | `{ "email": "string", "password": "string" }` |
| AUTH-02 | `{ "challengeToken": "string", "code": "string" }` |
| AUTH-03 | El backend no lee el body; puede omitirse |
| AUTH-04 | `{ "refreshToken": "string" }` |
| AUTH-06 | `{ "refreshToken": "string" }` opcional |
| AUTH-07 | `{ "currentPassword": "string", "newPassword": "string" }` |
| AUTH-08 | `{ "name": "string", "email": "string", "password": "string" }` |
| AUTH-09 | `{ "email": "string" }` |
| AUTH-10 | `{ "token": "string", "newPassword": "string" }` |

### 5.4 Reglas y notas

- `AUTH-01`: el usuario debe estar activo. Si tiene 2FA, responde `TwoFactorChallenge`; si no, responde `TokenPair`.
- `AUTH-03`: no reenvía nada; el autenticador TOTP no lo necesita.
- `AUTH-04`: el refresh es de un solo uso; el anterior queda revocado.
- `AUTH-06`: con `refreshToken` revoca ese token; sin body, revoca todos los del usuario.
- `AUTH-07`: revoca todos los refresh tokens. El access token actual sigue válido hasta expirar.
- `AUTH-08`: asigna automáticamente `LogisticsCoordinator`; no envía correo de confirmación.
- `AUTH-09`: responde `204` para correo inexistente y en producción. En Development devuelve `200` con `{ email, token }` si el usuario existe.
- `AUTH-10`: el token de recuperación dura 15 minutos y es de un solo uso.
- **Limitaciones:** no hay `429`, bloqueo por intentos fallidos ni cookie `httpOnly`. Los refresh tokens viven en memoria y se pierden al reiniciar el backend.

---

## 6. Pedidos

**Fuente:** `src/Web/Endpoints/Orders.cs`, `src/Application/Orders`.

### 6.1 Endpoints

| ID | Método | Ruta | Rol | Éxito | Errores |
|---|---|---|---|---|---|
| ORD-01 | POST | `/api/Orders` | Coordinador | 201 `OrderResponse` | 400, 401, 403, 404, 409 |
| ORD-02 | GET | `/api/Orders` | Coordinador | 200 `OrderResponse[]` | 400, 401, 403 |
| ORD-03 | GET | `/api/Orders/{id}` | Coordinador | 200 `OrderResponse` | 401, 403, 404 |

### 6.2 `OrderResponse`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | number |  |
| `description` | string |  |
| `deliveryType` | enum | `Parcel`, `Documents`, `Perishable` |
| `priority` | enum | `Low`, `Medium`, `Urgent` |
| `weightKg` | number | kg |
| `entryDate` | date | `YYYY-MM-DD` |
| `deadlineAt` | datetime | ISO 8601 |
| `status` | enum | `Pending`, `InRoute`, `Delivered`, `Returned` |
| `distributionCenterId` | number |  |
| `stopId` | number |  |
| `centerName` | string |  |
| `zoneName` | string |  |
| `address` | string |  |

### 6.3 Crear pedido — ORD-01

```json
{
  "description": "Paquete de repuestos",
  "deliveryType": "Parcel",
  "priority": "Urgent",
  "weightKg": 4.5,
  "entryDate": "2026-11-25",
  "deadlineAt": "2026-11-26T18:00:00-05:00",
  "distributionCenterId": 1,
  "stopId": 1
}
```

| Campo | Regla |
|---|---|
| `description` | 1–500 caracteres |
| `weightKg` | > 0 |
| `entryDate` | Fecha válida, distinta de `0001-01-01` |
| `deadlineAt` | Fecha válida con día igual o posterior a `entryDate` |
| `distributionCenterId` | > 0 |
| `stopId` / `stop` | Exactamente uno de los dos |

Alternativa con parada por dirección:

```json
{
  "stop": {
    "address": "Calle 23 #456",
    "zoneId": 1
  }
}
```

- `stop.address`: 1–300 caracteres; `stop.zoneId`: > 0.
- El centro debe cubrir la zona de la parada.
- Si la parada no existe, se crea sin geocodificar.
- `403` si el coordinador no está autorizado para el centro.
- `409` si ya existe un pedido con el mismo centro, parada, tipo, descripción y fecha de entrada.

### 6.4 Listar pedidos — ORD-02

| Query | Tipo | Regla |
|---|---|---|
| `distributionCenterId` | int? | > 0 |
| `zoneId` | int? | > 0 |
| `deliveryType` | enum? |  |
| `priority` | enum? |  |
| `status` | enum? |  |
| `pageNumber` | int | Por defecto `1`, > 0 |
| `pageSize` | int | Por defecto `20`, entre 1 y 100 |

- Respuesta: **array** de `OrderResponse`.
- Totales en `X-Total-Count`, `X-Page-Number`, `X-Page-Size`.
- Solo devuelve pedidos de centros autorizados para el coordinador.

> **Brecha:** el frontend espera `{ items, pageNumber, pageSize, totalCount }` y `create` devuelve `number`. Ver [R-04](#16-hallazgos-de-integración).

---

## 7. Paradas

**Fuente:** `src/Web/Endpoints/Stops.cs`, `src/Application/Stop`.

### 7.1 Endpoints

| ID | Método | Ruta | Rol | Éxito | Errores |
|---|---|---|---|---|---|
| STOP-01 | GET | `/api/stops` | Bearer | 200 `StopDto[]` | 400, 401 |
| STOP-02 | POST | `/api/stops/create-stop` | Coordinador/Admin | 204 | 400, 401, 403, 404 |
| STOP-03 | PUT | `/api/stops/{stopId}` | Coordinador/Admin | 204 | 400, 401, 403, 404, 409 |
| STOP-04 | DELETE | `/api/stops/{stopId}` | Coordinador/Admin | 204 | 401, 403, 404, 409 |

### 7.2 `StopDto`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | number |  |
| `address` | string |  |
| `zoneId` | number |  |
| `zoneName` | string |  |
| `latitude` | number? | `null` si no está ubicada |
| `longitude` | number? | `null` si no está ubicada |

### 7.3 Crear/actualizar

```json
{
  "address": "Calle 23 #456",
  "zoneId": 1,
  "latitude": 23.136,
  "longitude": -82.381
}
```

| Campo | Regla |
|---|---|
| `address` | 1–300 caracteres |
| `zoneId` | > 0 |
| `latitude` | -90 a 90; junto con longitud o ninguna |
| `longitude` | -180 a 180; junto con latitud o ninguna |

- `GET /api/stops?zoneId=1` filtra por zona.
- `POST` y `PUT` devuelven **204 sin cuerpo**.
- Sin coordenadas, el backend intenta geocodificar la dirección.
- `POST` devuelve `400` si ya existe una parada con esa dirección en la zona y `404` si la zona no existe.
- `PUT` devuelve `404` si la parada o la zona no existen, `409` si la dirección ya existe en la zona y `400` si la nueva zona no cubre los pedidos existentes.
- `DELETE` devuelve `409` si la parada tiene pedidos o rutas.

> **Brecha:** el frontend espera un `Stop` al crear/actualizar; debe asumir `void`. Ver [R-06](#16-hallazgos-de-integración).

---

## 8. Rutas

**Fuente:** `src/Web/Endpoints/Routes.cs`, `src/Application/Routes`.

### 8.1 Endpoints

| ID | Método | Ruta | Rol | Éxito | Errores |
|---|---|---|---|---|---|
| ROUTE-01 | POST | `/api/routes/generate` | Coordinador | 200 `GeneratedRoute` | 400, 401, 403 |
| ROUTE-02 | POST | `/api/routes/add-review` | Supervisor | 204 | 400, 401, 403, 404 |
| ROUTE-03 | GET | `/api/routes/filter` | Bearer | 200 `Route[]` | 400, 401 |
| ROUTE-04 | GET | `/api/routes/{id}/map` | Bearer | 200 `RouteMap` | 401, 404 |

### 8.2 Modelos

**`RouteOrderDto`**

| Campo | Tipo |
|---|---|
| `id` | number |
| `description` | string |
| `deliveryType` | enum |
| `priority` | enum |
| `weightKg` | number |
| `deadlineAt` | datetime |
| `status` | enum |
| `stopId` | number |
| `stopAddress` | string |

**`RouteDto`**

| Campo | Tipo | Notas |
|---|---|---|
| `id` | number |  |
| `scheduledDate` | datetime |  |
| `generatorCoordinatorId` | string (GUID) |  |
| `distributionCenterId` | number |  |
| `deliveryPersonId` | string? (GUID) |  |
| `balanceCriterionId` | number |  |
| `ordersOrdered` | `RouteOrderDto[]` | Vacío si `withStops=false` |
| `balanceCriterion` | object? | `null` si `withBalanceCriterion=false` |
| `created` | datetime |  |

> **Brecha crítica:** `RouteDto` no incluye `reviewState` ni `latestReview`. El frontend no puede mostrar el estado real por fila. Ver [R-03](#16-hallazgos-de-integración).

**`GeneratedRoute`**

```json
{
  "routeId": 10,
  "orders": []
}
```

### 8.3 Generar ruta — ROUTE-01

```json
{
  "scheduledDate": "2026-11-26T00:00:00-05:00",
  "deliveryPersonId": "guid-del-repartidor",
  "distributionCenterId": 1,
  "balanceCriterionId": 1
}
```

| Campo | Regla |
|---|---|
| `scheduledDate` | No anterior a hoy |
| `deliveryPersonId` | No vacío, GUID |
| `distributionCenterId` | > 0 |
| `balanceCriterionId` | > 0 |

- Devuelve `200`, no `201`.
- Crea la ruta y genera la asignación de pedidos.

### 8.4 Revisar ruta — ROUTE-02

Con criterio existente:

```json
{
  "routeId": 10,
  "decision": "Rejected",
  "observations": "Reducir la carga del repartidor.",
  "balanceCritertiaId": 2
}
```

Con criterio nuevo:

```json
{
  "routeId": 10,
  "decision": "Rejected",
  "observations": "Reducir la carga del repartidor.",
  "balanceCriteria": {
    "name": "Carga ligera",
    "description": "Máximo de pedidos por ruta.",
    "customBalancedParameters": [
      {
        "name": "Máximo de pedidos",
        "metric": "OrderCount",
        "operator": "LessThanOrEqual",
        "appliedValue": 10
      }
    ]
  }
}
```

| Regla | Detalle |
|---|---|
| `decision` | `Approved` o `Rejected`; nunca `Pending` |
| Aprobación | `balanceCritertiaId` y `balanceCriteria` deben ser `null` |
| Rechazo | Exactamente uno de `balanceCritertiaId` o `balanceCriteria` |
| Observaciones | Obligatorias al rechazar |
| Criterio nuevo | `name` ≤ 50, `description` ≤ 200, `customBalancedParameters` no vacío |

- `204` si se registra.
- `404` si la ruta o el criterio no existen.
- Si hay criterio, se dispara la regeneración.
- **Brecha:** el campo real es `balanceCritertiaId` (errata); el frontend envía `newBalanceCriterionId`. Ver [R-05](#16-hallazgos-de-integración).

### 8.5 Filtrar rutas — ROUTE-03

| Query | Tipo | Semántica |
|---|---|---|
| `scheduleBefore` | datetime? | `ScheduledDate <= valor` |
| `scheduleLast` | datetime? | `ScheduledDate >= valor` |
| `id` | int? | > 0 |
| `distributionCenterId` | int? | > 0 |
| `balanceCriterionId` | int? | > 0 |
| `deliveryPersonId` | string? | GUID |
| `logisticCoordiantorId` | string? | GUID del generador (typo real) |
| `supervisorId` | string? | **Ignorado por bug** |
| `withStops` | bool? | `true` por defecto |
| `withBalanceCriterion` | bool? | `true` por defecto |
| `state` | enum? | `Pending`, `Approved`, `Rejected` |

- `state=Pending` devuelve rutas **sin ninguna revisión**.
- `state=Approved`/`Rejected` devuelve rutas con **alguna** revisión de esa decisión, no la última.
- `supervisorId` no funciona: falta reasignar `query`.
- No hay paginación.
- Cualquier autenticado ve todas las rutas.

### 8.6 Mapa — ROUTE-04

```json
{
  "routeId": 10,
  "scheduledDate": "2026-11-26T00:00:00-05:00",
  "center": {
    "id": 1,
    "name": "Centro Habana",
    "latitude": 23.132,
    "longitude": -82.374
  },
  "stops": [
    {
      "visitOrder": 1,
      "stopId": 1,
      "address": "Calle 23 #456",
      "zoneId": 1,
      "latitude": 23.136,
      "longitude": -82.381,
      "orders": [
        {
          "id": 1,
          "description": "Paquete de repuestos",
          "priority": "Urgent",
          "deliveryType": "Parcel",
          "weightKg": 4.5,
          "deadlineAt": "2026-11-26T18:00:00-05:00",
          "status": "Pending"
        }
      ]
    }
  ],
  "path": {
    "latLngs": [[23.132, -82.374], [23.136, -82.381]],
    "distanceMeters": 1200,
    "durationSeconds": 300,
    "source": "osrm"
  }
}
```

- `latLngs` usa `[latitud, longitud]`, listo para Leaflet.
- `path` puede ser `null` si hay menos de dos puntos ubicados.
- `source`: `osrm` o `estimated`.

---

## 9. Criterios de equilibrio

**Fuente:** `src/Web/Endpoints/BalanceCriteria.cs`, `src/Application/BalanceCriterion`.

### 9.1 Endpoints

| ID | Método | Ruta | Rol | Éxito | Errores |
|---|---|---|---|---|---|
| BAL-01 | GET | `/api/balance-criteria/get-all` | Bearer | 200 `BalanceCriterion[]` | 401 |
| BAL-02 | POST | `/api/balance-criteria/create-balance-criterion` | Coordinador/Admin | 200 `number` | 400, 401, 403 |
| BAL-03 | DELETE | `/api/balance-criteria/{id}` | Coordinador/Admin | 204 | 400, 401, 403, 404 |

### 9.2 Modelo

```json
{
  "id": 1,
  "name": "Equilibrio base",
  "description": "Criterio predefinido por tipo de entrega.",
  "authorCoordinatorId": null,
  "isPredefined": true,
  "parameters": [
    {
      "id": 1,
      "name": "Proporción de paquetería",
      "metric": "DeliveryTypeProportion",
      "operator": "GreaterThanOrEqual",
      "appliedValue": 0.4,
      "targetDeliveryType": "Parcel",
      "balanceCriterionId": 1
    }
  ]
}
```

### 9.3 Crear — BAL-02

```json
{
  "name": "Carga ligera",
  "description": "Máximo de pedidos y peso por ruta.",
  "customBalancedParameters": [
    {
      "name": "Máximo de pedidos",
      "metric": "OrderCount",
      "operator": "LessThanOrEqual",
      "appliedValue": 10
    },
    {
      "name": "Proporción de paquetería",
      "metric": "DeliveryTypeProportion",
      "operator": "GreaterThanOrEqual",
      "appliedValue": 0.4,
      "deliveryType": "Parcel"
    }
  ]
}
```

| Regla | Detalle |
|---|---|
| `name` | 1–50 caracteres |
| `description` | 1–200 caracteres |
| Parámetros | No vacío |
| Métricas | Una por tipo, salvo `DeliveryTypeProportion` |
| Proporción | Exige `deliveryType`; sin duplicados; suma ≤ 1 |

- Devuelve **un número**, no un objeto.
- En la respuesta, `deliveryType` se llama `targetDeliveryType`.

---

## 10. Administración de roles

**Fuente:** `src/Web/Endpoints/AdminManagement/ManageRoles.cs`.

### 10.1 Endpoints

| ID | Método | Ruta | Rol | Éxito | Errores |
|---|---|---|---|---|---|
| ROLE-01 | POST | `/api/admin/manage-roles/create-delivery-person` | Admin | 204 | 400, 401, 403 |
| ROLE-02 | POST | `/api/admin/manage-roles/create-operations-supervisor` | Admin | 204 | 400, 401, 403 |
| ROLE-03 | POST | `/api/admin/manage-roles/create-logistics-cordinator` | Admin | 204 | 400, 401, 403 |
| ROLE-04 | POST | `/api/admin/manage-roles/create-delivery-person-full` | Admin | 201 `string` | 400, 401, 403 |
| ROLE-05 | POST | `/api/admin/manage-roles/create-coordinator-full` | Admin | 201 `string` | 400, 401, 403 |
| ROLE-06 | POST | `/api/admin/manage-roles/create-supervisor-full` | Admin | 201 `string` | 400, 401, 403 |
| ROLE-07 | GET | `/api/admin/manage-roles/users` | Admin | 200 | 401, 403 |
| ROLE-08 | GET | `/api/admin/manage-roles/delivery-persons` | Admin/Coord/Sup | 200 | 401, 403 |
| ROLE-09 | GET | `/api/admin/manage-roles/coordinators` | Bearer | 200 | 401 |
| ROLE-10 | GET | `/api/admin/manage-roles/supervisors` | Admin | 200 | 401, 403 |
| ROLE-11 | PUT | `/api/admin/manage-roles/users/{userId}/role` | Admin | 204 | 400, 401, 403, 404 |

### 10.2 Crear perfil para usuario existente

| ID | Body |
|---|---|
| ROLE-01 | `{ "userId": "GUID", "birthDay": "1995-05-20", "fleet": "Flota Centro" }` |
| ROLE-02 | `{ "userId": "GUID", "controlArea": "Centro Habana" }` |
| ROLE-03 | `{ "userId": "GUID", "speciality": "Coordinación urbana" }` |

- El usuario debe existir y no tener ningún rol.
- ROLE-01 valida edad ≥ 18 y `fleet` no vacío.
- ROLE-02 valida `controlArea` no vacío.
- ROLE-03 conserva la errata `speciality` y la ruta `cordinator`.

### 10.3 Crear cuenta + perfil

| ID | Body |
|---|---|
| ROLE-04 | `{ email, password, firstName?, lastName?, birthDay, fleet, distributionCenterIds[] }` |
| ROLE-05 | `{ email, password, firstName?, lastName?, specialty, authorizedCenterIds[] }` |
| ROLE-06 | `{ email, password, firstName?, lastName?, controlArea }` |

- Devuelven `201` con el `userId` como string.
- `Location` apunta al recurso del perfil, aunque no existe un `GET` de ese recurso.
- Email y password son obligatorios; el correo no puede existir.
- ROLE-04 valida edad ≥ 18.
- ROLE-05 usa `specialty`; ROLE-03 usa `speciality`.
- Los centros inválidos producen `400`.

### 10.4 Consultas

**`UserWithRoleDto`**

```json
{
  "id": "GUID",
  "email": "ana@demo.dev",
  "name": "Ana Demo",
  "role": "LogisticsCoordinator",
  "active": true
}
```

**`DeliveryPersonDto`**

```json
{
  "id": "GUID",
  "email": "marco@demo.dev",
  "name": "Marco Demo",
  "dateOfBirth": "1995-05-20",
  "fleet": "Flota Centro"
}
```

**`CoordinatorDto`**

```json
{
  "id": "GUID",
  "email": "ana@demo.dev",
  "name": "Ana Demo",
  "specialty": "Coordinación urbana",
  "authorizedCenterIds": [1]
}
```

**`SupervisorDto`**

```json
{
  "id": "GUID",
  "email": "sofia@demo.dev",
  "name": "Sofía Demo",
  "controlArea": "Centro Habana"
}
```

- `delivery-persons` **no devuelve** `distributionCenterIds` ni nombres de centros.
- `coordinators` es accesible para cualquier autenticado.
- `supervisors` es solo para administrador.

### 10.5 Asignar rol — ROLE-11

```json
{ "role": "OperationsSupervisor" }
```

- `{ "role": "" }` deja al usuario sin rol.
- Elimina todos los roles actuales y asigna el nuevo.
- `400` si el rol no existe en Identity.
- `404` si el usuario no existe.

---

## 11. Centros de distribución

**Fuente:** `src/Web/Endpoints/AdminManagement/DistributionCenters.cs`.

> Todos los endpoints requieren `Administrator`. El coordinador necesita leer centros y zonas para operar; esa lectura no está habilitada. Ver [R-02](#16-hallazgos-de-integración).

### 11.1 Endpoints

| ID | Método | Ruta | Éxito | Errores |
|---|---|---|---|---|
| CTR-01 | GET | `/api/admin/distribution-center/get-all` | 200 | 401, 403 |
| CTR-02 | GET | `/api/admin/distribution-center/{id}` | 200 | 401, 403, 404 |
| CTR-03 | POST | `/api/admin/distribution-center/create-distribution-center` | 204 | 400, 401, 403 |
| CTR-04 | PUT | `/api/admin/distribution-center/{id}` | 204 | 400, 401, 403, 404, 409 |
| CTR-05 | DELETE | `/api/admin/distribution-center/{id}` | 204 | 401, 403, 404, 409 |
| CTR-06 | POST | `/api/admin/distribution-center/add-covered-zone` | 204 | 400, 401, 403, 404 |
| CTR-07 | DELETE | `/api/admin/distribution-center/remove-covered-zones` | 204 | 400, 401, 403, 404 |
| CTR-08 | POST | `/api/admin/distribution-center/add-logistics-coordinators` | 204 | 400, 401, 403, 404 |
| CTR-09 | DELETE | `/api/admin/distribution-center/remove-logistics-coordinators` | 204 | 400, 401, 403, 404 |
| CTR-10 | POST | `/api/admin/distribution-center/add-delivery-persons` | 204 | 400, 401, 403, 404 |
| CTR-11 | DELETE | `/api/admin/distribution-center/remove-delivery-persons` | 204 | 400, 401, 403, 404 |

### 11.2 Modelos

**`DistributionCenterReducedDto`**

```json
{
  "id": 1,
  "name": "Centro Habana",
  "logisticsProgram": "Programa urbano",
  "latitude": 23.132,
  "longitude": -82.374,
  "coveredZoneIds": [1, 2, 3]
}
```

**`DistributionCenterExtendedDto`**

```json
{
  "id": 1,
  "name": "Centro Habana",
  "logisticsProgram": "Programa urbano",
  "latitude": 23.132,
  "longitude": -82.374,
  "coveredZones": [1, 2, 3],
  "authorizedCoordinators": ["GUID"],
  "assignedDeliveryPersons": ["GUID"],
  "orders": [1, 2, 3],
  "routes": [10]
}
```

### 11.3 Crear — CTR-03

```json
{
  "name": "Centro Vedado",
  "logisticProgram": "Programa urbano",
  "latitude": 23.128,
  "longitude": -82.389
}
```

- Campo real: `logisticProgram` (**singular**).
- No acepta `coveredZoneIds`.
- No devuelve el ID.
- `latitude` y `longitude` van juntas o ninguna.

### 11.4 Actualizar — CTR-04

```json
{
  "name": "Centro Vedado",
  "logisticsProgram": "Programa urbano actualizado",
  "latitude": 23.128,
  "longitude": -82.389,
  "coveredZoneIds": [1, 2]
}
```

- Campo real: `logisticsProgram` (**plural**).
- `coveredZoneIds` reemplaza la cobertura completa.
- Si se omite o es `null`, se eliminan todas las zonas.
- `409` si otro centro ya usa el nombre.

### 11.5 Asociaciones

| ID | Body |
|---|---|
| CTR-06 | `{ "distributionCenterId": 1, "zoneIds": [2, 3] }` |
| CTR-07 | `{ "distributionCenterId": 1, "zoneIds": [2] }` |
| CTR-08 | `{ "distributionCenterId": 1, "coordinatorIds": ["GUID"] }` |
| CTR-09 | `{ "distributionCenterId": 1, "coordinatorIds": ["GUID"] }` |
| CTR-10 | `{ "distributionCenterId": 1, "deliveryPersonIds": ["GUID"] }` |
| CTR-11 | `{ "distributionCenterId": 1, "deliveryPersonIds": ["GUID"] }` |

- CTR-07, CTR-09 y CTR-11 usan `DELETE` con body; en axios: `{ data: body }`.
- `400` si la asociación ya existe o no existe, según la operación.
- `404` si el centro, la zona, el coordinador o el repartidor no existen.

> **Brecha:** `create` no acepta zonas ni devuelve ID; el frontend envía `logisticsProgram` y `coveredZoneIds`. Ver [R-07](#16-hallazgos-de-integración).

---

## 12. Zonas

**Fuente:** `src/Web/Endpoints/AdminManagement/ZonesManagement.cs`.

### 12.1 Endpoints

| ID | Método | Ruta | Éxito | Errores |
|---|---|---|---|---|
| ZONE-01 | GET | `/api/admin/zones/get-all` | 200 `ZoneDto[]` | 401, 403 |
| ZONE-02 | POST | `/api/admin/zones/create-zone` | 204 | 400, 401, 403 |
| ZONE-03 | PUT | `/api/admin/zones/{zoneId}` | 204 | 400, 401, 403, 404, 409 |
| ZONE-04 | DELETE | `/api/admin/zones/{zoneId}` | 204 | 401, 403, 404, 409 |

### 12.2 Modelo y bodies

```json
{ "id": 1, "name": "Centro" }
```

| ID | Body |
|---|---|
| ZONE-02 | `{ "name": "Centro" }` |
| ZONE-03 | `{ "name": "Centro Histórico" }` |

- `name`: 1–200 caracteres.
- `400` si el nombre está duplicado al crear.
- `409` si el nombre está duplicado al actualizar.
- `409` al eliminar si tiene paradas o está asignada a un centro.
- Todos los endpoints son solo para `Administrator`.

---

## 13. Entregas

**Fuente:** `src/Web/Endpoints/Deliveries.cs`.

### 13.1 Endpoints

| ID | Método | Ruta | Rol | Éxito | Errores |
|---|---|---|---|---|---|
| DEL-01 | GET | `/api/delivery/routes` | Repartidor | 200 `AssignedRoute[]` | 401, 403 |
| DEL-02 | POST | `/api/delivery/routes/{routeId}/stops/{orderId}` | Repartidor | 200 `AssignedStop` | 400, 401, 403, 404, 409 |
| DEL-03 | GET | `/api/delivery/reports/by-center` | Admin/Coord/Sup | 200 `DeliveryCenterReport[]` | 401, 403 |

### 13.2 Modelos

**`AssignedRoute`**

```json
{
  "routeId": 10,
  "scheduledDate": "2026-11-26",
  "centerName": "Centro Habana",
  "stops": [
    {
      "orderId": 1,
      "description": "Paquete de repuestos",
      "address": "Calle 23 #456",
      "zoneName": "Centro",
      "priority": "Urgent",
      "result": "Pending",
      "observations": null
    }
  ]
}
```

**`DeliveryCenterReport`**

```json
{
  "distributionCenterId": 1,
  "centerName": "Centro Habana",
  "approvedRoutes": 2,
  "totalStops": 12,
  "successfulDeliveries": 8,
  "failedDeliveries": 1,
  "pendingDeliveries": 3
}
```

### 13.3 Registrar entrega — DEL-02

```json
{
  "result": "Failed",
  "observations": "El cliente no estaba en el domicilio."
}
```

- `result`: `Successful` o `Failed`.
- `observations` es obligatorio cuando `result` es `Failed`.
- `404` si la ruta no existe o el pedido no pertenece a la ruta.
- `409` si la entrega ya fue registrada.
- `400` si la ruta no está asignada al repartidor o no está aprobada.
- El path usa `stops`, pero el segundo ID es `orderId`.

### 13.4 Notas

- DEL-01 solo devuelve rutas **aprobadas por la última revisión** y asignadas al repartidor.
- `result` es `Pending` si no hay registro; en caso contrario, `Successful` o `Failed`.
- Una parada con varios pedidos aparece como varias entradas.
- DEL-03 solo considera rutas aprobadas.
- `totalStops` en realidad cuenta **pedidos**, no paradas.
- DEL-03 no está filtrado por coordinador: devuelve datos de todos los centros. Ver [R-09](#16-hallazgos-de-integración).

---

## 14. Reprogramaciones

**Fuente:** `src/Web/Endpoints/Reschedulings.cs`.

### 14.1 Endpoints

| ID | Método | Ruta | Rol | Éxito | Errores |
|---|---|---|---|---|---|
| RESCH-01 | GET | `/api/reschedulings` | Bearer | 200 `Rescheduling[]` | 401 |
| RESCH-02 | POST | `/api/reschedulings` | Repartidor | 201 `Rescheduling` | 400, 401, 403, 404, 409 |
| RESCH-03 | POST | `/api/reschedulings/{id}/resolve` | Coordinador | 200 `Rescheduling` | 400, 401, 403, 404 |

### 14.2 Modelo

```json
{
  "id": 1,
  "routeId": 10,
  "orderId": 1,
  "orderDescription": "Paquete de repuestos",
  "reason": "El cliente no estaba.",
  "requestDate": "2026-11-25T15:30:00-05:00",
  "status": "Pending",
  "manualResult": null,
  "resolverCoordinatorId": "GUID",
  "resolverCoordinatorName": "Coordinador"
}
```

### 14.3 Crear — RESCH-02

```json
{
  "routeId": 10,
  "orderId": 1,
  "reason": "El cliente no estaba.",
  "resolverCoordinatorId": "GUID"
}
```

- `reason` y `resolverCoordinatorId` son obligatorios.
- El pedido debe pertenecer a la ruta y la ruta debe estar asignada al repartidor.
- El coordinador debe existir.
- `409` si ya existe una solicitud para ese pedido en esa ruta.
- El estado inicial es `Pending`.

### 14.4 Resolver — RESCH-03

```json
{ "manualResult": "Rescheduled" }
```

- Valores: `Reassigned`, `Rescheduled`, `ReturnedToWarehouse`.
- Solo el coordinador asignado puede resolver.
- `400` si ya está resuelta o si el coordinador no es el asignado.

### 14.5 Notas

- RESCH-01 filtra por relación: rutas del repartidor o solicitudes asignadas al coordinador.
- Administrador y supervisor normalmente reciben una lista vacía.
- `resolverCoordinatorName` siempre devuelve `"Coordinador"`; falta resolver el nombre real.
- El estado `InProgress` existe, pero ningún endpoint lo asigna.

---

## 15. Capacidades no implementadas

| ID | Capacidad esperada | Estado | Forma esperada por el frontend |
|---|---|---|---|
| DASH-01 | `GET /api/dashboard/summary` | **No existe** | `{ totalOrders, activeRoutes, pendingDeliveries, completedDeliveries, generatedAt }` |
| REP-01 | `GET /api/reports/{reportId}` | **No existe** | `{ id, title, description, columns[], rows[] }` |
| ORD-04 | Clasificación/cambio de estado de pedido | **No existe** | Sin contrato definido |

### 15.1 Dashboard — DASH-01

```json
{
  "totalOrders": 0,
  "activeRoutes": 0,
  "pendingDeliveries": 0,
  "completedDeliveries": 0,
  "generatedAt": "2026-11-25T15:30:00-05:00"
}
```

No debe mostrarse información inventada. Si el endpoint no existe, la UI debe indicar “Pendiente de backend” o calcular solo métricas derivables de endpoints reales.

### 15.2 Reportes — REP-01

Identificadores esperados:

- `generated-routes`
- `managed-orders`
- `validated-routes`
- `delivery-performance`
- `center-comparison`
- `priority-correlation`

El único reporte real es `DEL-03` (`/api/delivery/reports/by-center`), que no cubre los seis reportes del frontend.

### 15.3 Clasificación — ORD-04

El frontend tiene un botón “Clasificar” deshabilitado. No existe endpoint para cambiar `OrderStatus` ni para clasificar prioridad. Debe eliminarse o implementarse con contrato explícito.

---

## 16. Hallazgos de integración

### Severidad

| Nivel | Criterio |
|---|---|
| **Alta** | Bloquea un flujo principal o puede producir datos incorrectos |
| **Media** | Requiere una solución temporal o afecta seguridad/UX de forma relevante |
| **Baja** | Nomenclatura, documentación o alcance secundario |

| ID | Severidad | Hallazgo | Evidencia | Acción |
|---|---|---|---|---|
| R-01 | Alta | Dashboard, reportes y clasificación no existen | `src/Web/Endpoints` | Implementar backend o mostrar “Pendiente de backend” |
| R-02 | Alta | Coordinador no puede leer centros/zonas | `DistributionCenters.cs`, `ZonesManagement.cs` | Ampliar permisos o crear endpoints de catálogo |
| R-03 | Alta | `RouteDto` no incluye estado de revisión | `RouteDto.cs` | Añadir `reviewState`/`latestReview` |
| R-04 | Alta | Lista de pedidos y creación no coinciden | `Orders.cs` vs `orders.api.ts` | Adaptar el cliente a array + cabeceras y a `OrderResponse` |
| R-05 | Alta | Revisión usa `balanceCritertiaId` | `AddReview.cs` | Enviar el campo real o acordar alias |
| R-06 | Media | Paradas devuelven `204` | `Stops.cs` | Cambiar el cliente a `Promise<void>` |
| R-07 | Media | Crear centro no acepta zonas ni devuelve ID | `Create.cs` | Alta en dos pasos o cambio de backend |
| R-08 | Media | Filtro `supervisorId` no tiene efecto | `GetRouteByFilter.cs` | Corregir backend |
| R-09 | Media | Reporte por centro sin alcance y `totalStops` cuenta pedidos | `Deliveries.cs` | Corregir backend y etiqueta |
| R-10 | Media | Nombre del coordinador es placeholder; `InProgress` no se usa | `Reschedulings.cs` | Resolver nombre y transiciones |
| R-11 | Media | Repartidores sin centros asignados en la lista | `ManageRoles.cs` | Incluir `distributionCenterIds` |
| R-12 | Media | Registro asigna coordinador; reenvío 2FA es no-op | `Auth.cs` | Acordar comportamiento |
| R-13 | Media | Refresh en memoria, sin cookie `httpOnly`, sin `429` | `RefreshTokenStore.cs`, `DependencyInjection.cs` | Decidir estrategia de seguridad |
| R-14 | Baja | CORS abierto a cualquier origen | `Program.cs` | Restringir en producción |
| R-15 | Baja | Filtro de rutas visible para cualquier rol y sin paginación | `Routes.cs` | Revisar alcance |
| R-16 | Baja | Erratas de contrato | `balanceCritertiaId`, `logisticProgram`, `cordinator`, `speciality`, `logisticCoordiantorId` | Documentar o corregir |
| R-17 | Baja | Token de recuperación en logs y respuesta de desarrollo | `Auth.cs` | Aceptar solo en Development |
| R-18 | Baja | Navegación muestra acciones que terminan en `403` | `navConfig` y guards | Alinear UI con roles |

### 16.1 Decisiones pendientes

1. ¿El coordinador podrá leer centros y zonas?
2. ¿Se añadirá `reviewState`/`latestReview` a `RouteDto`?
3. ¿Se corrige `balanceCritertiaId` o se acepta `newBalanceCriterionId`?
4. ¿Quién puede listar pedidos y generar rutas?
5. ¿Se implementan dashboard, reportes y clasificación?
6. ¿El refresh token pasará a cookie `httpOnly`?
7. ¿Se implementarán `429` y bloqueo de cuenta?
8. ¿Se habilitará 2FA para un usuario demo?

---

## 17. Trazabilidad

| Grupo | Fuente backend | Cliente frontend | Estado |
|---|---|---|---|
| Auth | `src/Web/Endpoints/Auth.cs` | `src/api/auth.api.ts` | Implementado; revisar 2FA y refresh |
| Pedidos | `src/Web/Endpoints/Orders.cs` | `src/api/orders.api.ts` | Parcial |
| Paradas | `src/Web/Endpoints/Stops.cs` | `src/api/stops.api.ts` | Parcial |
| Rutas | `src/Web/Endpoints/Routes.cs` | `src/api/routes.api.ts` | Parcial |
| Criterios | `src/Web/Endpoints/BalanceCriteria.cs` | `src/api/balance-criteria.api.ts` | Implementado |
| Admin roles | `src/Web/Endpoints/AdminManagement/ManageRoles.cs` | `src/api/actors.api.ts`, `src/api/admin.api.ts` | Implementado; faltan centros en repartidores |
| Centros | `src/Web/Endpoints/AdminManagement/DistributionCenters.cs` | `src/api/centers.api.ts` | Parcial; solo admin |
| Zonas | `src/Web/Endpoints/AdminManagement/ZonesManagement.cs` | `src/api/centers.api.ts` | Parcial; solo admin |
| Entregas | `src/Web/Endpoints/Deliveries.cs` | `src/api/deliveries.api.ts` | Implementado; revisar reporte |
| Reprogramaciones | `src/Web/Endpoints/Reschedulings.cs` | `src/api/reschedulings.api.ts` | Parcial |
| Dashboard | No existe | `src/api/dashboard.api.ts` | No existe |
| Reportes | No existe | `src/api/reports.api.ts` | No existe |

---

## 18. Usuarios y datos demo

### 18.1 Usuarios seed

| Correo | Contraseña | Rol | Notas |
|---|---|---|---|
| `carlos@demo.dev` | `Password123!` | `Administrator` | Administrador total |
| `ana@demo.dev` | `Password123!` | `LogisticsCoordinator` | Coordinadora del Centro Habana |
| `sofia@demo.dev` | `Password123!` | `OperationsSupervisor` | Supervisora de Centro Habana |
| `marco@demo.dev` | `Password123!` | `DeliveryPerson` | Repartidor de Flota Centro |
| `administrator@localhost` | `Administrator1!` | `Administrator` | Usuario de plantilla |

**No hay 2FA habilitado en los usuarios demo.** El flujo existe en el frontend, pero no se puede probar con el seed actual sin habilitarlo en Identity.

### 18.2 Datos demo

- Zonas: `Centro`, `Vedado`, `Plaza`.
- Centro: `Centro Habana`, cubre las tres zonas.
- Paradas: `Calle 23 #456`, `Avenida 5ta #120`, `Calle 12 #78`.
- Pedidos: 3, uno por parada.
- Criterio: `Equilibrio base`.

Los datos se crean al arrancar el backend en Development (`ApplicationDbContextInitialiser.SeedDemoDataAsync`).

---

## 19. Endpoints de plantilla excluidos

Estos grupos siguen en el backend como restos de la plantilla y **no forman parte del producto**:

- `/api/TodoItems`
- `/api/TodoLists`
- `/api/WeatherForecasts`

No deben usarse desde el frontend ni documentarse como funcionalidad de Smart Routes. Su eliminación corresponde a una tarea de limpieza del backend.

---

## 20. Historial de revisiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-11-25 | Contrato inicial verificado contra `develop@2831109` |
