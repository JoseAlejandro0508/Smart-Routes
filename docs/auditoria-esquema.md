# Auditoría del esquema frente al informe de diseño

Issue #28. Compara `src/Domain/Entities`, `src/Infrastructure/Data/Configurations` y las migraciones con las secciones 3 y 4.3 del informe corregido.

**Base:** `develop` en `14da877`, que ya incluye los PR #51 (CRUD de entidades), #52 (pedidos), #53 (lógica de rutas) y #54 (generación de rutas y mapa).

**Migración de esta auditoría:** `SchemaAuditConstraints`.

## Resultado por tabla

| Tabla del informe | Tabla en el código | Estado | Observaciones |
|---|---|---|---|
| COORDINADOR_LOGISTICO | `LogisticsCoordinators` | Corregido | Tenía un `UserId` que repetía `Id` (la clave, que ya es la FK al usuario) y nunca se guardaba en `Id`, así que el alta fallaba. Se quita `UserId` y el alta asigna `Id`. |
| REPARTIDOR | `DeliveryPersons` | Corregido | Mismo problema de `UserId`. Guarda la fecha de nacimiento en vez de `edad` (así la edad no se queda desactualizada); se añade el `CHECK` de mayoría de edad. |
| SUPERVISOR_OPERACIONES | `OperationsSupervisors` | Corregido | Mismo problema de `UserId`. |
| CENTRO_DISTRIBUCION | `DistributionCenters` | Corregido | Coordenadas opcionales (añadido del PR #54) con `CHECK` de rango. |
| ZONA | `Zones` | Correcto | |
| PARADA | `Stops` | Corregido | Coordenadas opcionales con `CHECK` de rango. |
| PEDIDO | `Orders` | Corregido | Clave de antiduplicados correcta. `CHECK` de dominio para tipo, prioridad y estado. |
| CRITERIO_EQUILIBRIO | `BalanceCriteria` | Correcto | El autor admite nulo (criterio preestablecido). |
| PARAMETRO | `BalanceParameters` | Corregido | `CHECK` de dominio para métrica, operador y tipo objetivo, y rango [0, 1] para las proporciones. Guarda el valor aplicado (decisión 1). |
| RUTA | `Routes` | Según diseño | Referencia su criterio y su repartidor; sin capacidad ni fecha de creación propia (decisiones 1, 2, 3 y 5). |
| REVISION | `Reviews` | Corregido | `CHECK` de dominio para la decisión. Indica el criterio de la re-confección (decisiones 3, 4 y 6). |
| REGISTRO_ENTREGA | `DeliveryRecords` | Corregido | FK compuesta a `RouteOrders`, única. `CHECK` de dominio para el resultado. |
| REPROGRAMACION | `Reschedulings` | Corregido | `CHECK` de dominio para el estado y el resultado manual. |
| RUTA_PARADA | `RouteStops` | Correcto | Clave alternativa `(RouteId, VisitOrder)` y `VisitOrder >= 1`. |
| RUTA_PEDIDO | `RouteOrders` | Correcto | |
| RUTA_PARAMETRO | `RouteParameters` | Según diseño | Relaciona ruta y criterio; la referencia principal es `Routes.BalanceCriterionId`. |
| REVISION_PARAMETRO | `ReviewParameters` | Sin uso | Sustituida por el criterio indicado en la revisión (decisión 4). Se mantiene en el esquema porque `DeleteBalanceCriterion` la consulta. |
| COORDINADOR_CENTRO | `CoordinatorCenters` | Correcto | |
| REPARTIDOR_CENTRO | `DeliveryPersonCenters` | Correcto | |
| CENTRO_ZONA | `CenterZones` | Correcto | |
| RK | `RK` | Añadido | No existía. Clave de seis atributos con FK a cada entidad; la aplicación no la usa. |

`Administrators` no está en el informe, porque la gestión de usuarios queda fuera del modelo del dominio. Se le añade el `CHECK` de dominio del nivel de acceso.

## Decisiones de diseño adoptadas (PR #53)

El código sigue el diseño implementado por José Alejandro en el PR #53, que cambia algunas partes del informe. Así se cumple cada requisito con ese diseño:

1. **Los valores aplicados están en el parámetro del criterio** (`BalanceParameter.AppliedValue`) y la ruta referencia el criterio (`Routes.BalanceCriterionId`). Para que cada ruta conserve la configuración con la que se generó (RF-08), un criterio que ya usa alguna ruta no debe editarse: para cambiar valores se crea un criterio nuevo (issue #12).
2. **No hay capacidad del vehículo en la ruta.** El límite de peso se expresa con un parámetro `PESO_TOTAL` del criterio, que la generación automática respeta (RF-07).
3. **La fecha de creación de la ruta y la de la revisión son la columna de auditoría `Created`.** La última revisión de una ruta es la de `Created` más reciente (RF-12, issue #13).
4. **La re-confección indica un criterio completo** en la revisión (`Review.BalanceCriterioId`, existente o creado en el momento), en lugar de parámetros sueltos con `valor_indicado`. La ruta nueva se genera con ese criterio y queda vinculada con `OriginReviewId` (RF-11).
5. **El repartidor se elige al generar la ruta** (`GenerateCommand.DeliveryPersonId`). La validación de que está asignado al centro y la regla de una ruta aprobada por día se hacen sobre esa elección (RF-17, issue #16).
6. **La decisión de revisión admite `Pending`.** Una ruta está pendiente de aprobación si no tiene revisiones o si la última es `Pending`.

El informe de Bases de Datos describe el diseño original; conviene actualizar en él estas seis decisiones para que coincida con el código.

## Restricciones del informe

### 3.1 Unicidad
Implementadas: `(id_ruta, orden_visita)`, `(id_ruta, id_pedido)` en entregas y en reprogramaciones, `id_revision_origen` único si no es nulo, antiduplicados de pedidos y un solo repartidor por ruta.

### 3.2 Semánticas
- Dominios de todos los enumerados: añadidos como `CHECK` en esta auditoría.
- `peso_kg > 0` y `orden_visita >= 1`: ya existían. La capacidad se expresa como parámetro del criterio (decisión 2).
- `edad >= 18`: `CHECK` sobre `DateOfBirth` y validación en el comando de alta.
- `tipo_entrega_objetivo` no nulo si y solo si la métrica es `PROPORCION_TIPO`, observaciones obligatorias al rechazar, y `resultado_manual` y `fecha_resolucion` solo si la solicitud está resuelta: ya existían.
- `valor_aplicado` en [0, 1] para `PROPORCION_TIPO`: ahora es un `CHECK`, porque el valor está en la misma tabla que la métrica.

### 3.3 Temporales
Implementadas las de una sola tabla: fecha programada no anterior a la creación (ahora sobre `Created`), hora límite no anterior al ingreso y resolución posterior a la solicitud.

### 3.4 Integridad referencial
Las FK, los nulos permitidos, el borrado restringido y el borrado en cascada de las rutas sin revisar coinciden con el informe.

## Pendiente: reglas que necesitan disparadores

Cruzan varias tablas, así que no se pueden expresar con claves ni `CHECK`. Quedan en los issues donde se implementa la lógica:

| Regla del informe | Issue |
|---|---|
| Pedido vigente único en rutas pendientes o aprobadas | #9 |
| Coherencia ruta–parada | #11 |
| Ruta reconfeccionada del mismo centro que la revisada y con el criterio indicado | #15 |
| Un repartidor sin dos rutas aprobadas el mismo día; repartidor asignado al centro | #16 |
| Fechas entre tablas: revisión posterior a la creación de la ruta, entrega posterior a la aprobación, etc. | #14, #17, #18 |

La generación automática (PR #54) ya respeta en la aplicación la coherencia ruta–parada, el centro de la ruta y el pedido vigente único (solo toma pedidos pendientes), pero eso no sustituye a los disparadores.

## Otros hallazgos fuera de alcance

- `src/Domain/Entities` contiene `NewStop`, `RouteStatus` y `RouteOrderStatus`, que no están mapeadas a la base de datos (parecen pensadas para el estado en memoria del issue #19). `RouteStatus` tiene el mismo nombre que el enumerado `Domain.Enums.RouteStatus`.
- `PriorityLevel`, `TodoItem` y `TodoList` son de la plantilla; se eliminan en el issue #26.
- La restauración de paquetes falla con la auditoría de NuGet activada (`Aspire.Hosting 13.2.0` y otros tienen vulnerabilidades conocidas); hay que actualizarlos.
