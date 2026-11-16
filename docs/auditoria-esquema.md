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
| PARAMETRO | `BalanceParameters` | Corregido, con diferencias | `CHECK` de dominio para métrica, operador y tipo objetivo, y rango [0, 1] para las proporciones. Ver «Diferencias con el informe». |
| RUTA | `Routes` | Con diferencias | Ver «Diferencias con el informe». |
| REVISION | `Reviews` | Corregido, con diferencias | `CHECK` de dominio para la decisión. |
| REGISTRO_ENTREGA | `DeliveryRecords` | Corregido | FK compuesta a `RouteOrders`, única. `CHECK` de dominio para el resultado. |
| REPROGRAMACION | `Reschedulings` | Corregido | `CHECK` de dominio para el estado y el resultado manual. |
| RUTA_PARADA | `RouteStops` | Correcto | Clave alternativa `(RouteId, VisitOrder)` y `VisitOrder >= 1`. |
| RUTA_PEDIDO | `RouteOrders` | Correcto | |
| RUTA_PARAMETRO | `RouteParameters` | Con diferencias | Ahora relaciona ruta y criterio, lo mismo que ya dice `Routes.BalanceCriterionId`. |
| REVISION_PARAMETRO | `ReviewParameters` | Con diferencias | Sigue en el esquema pero ya no se usa (ver abajo). |
| COORDINADOR_CENTRO | `CoordinatorCenters` | Correcto | |
| REPARTIDOR_CENTRO | `DeliveryPersonCenters` | Correcto | |
| CENTRO_ZONA | `CenterZones` | Correcto | |
| RK | `RK` | Añadido | No existía. Clave de seis atributos con FK a cada entidad; la aplicación no la usa. |

`Administrators` no está en el informe, porque la gestión de usuarios queda fuera del modelo del dominio. Se le añade el `CHECK` de dominio del nivel de acceso.

## Diferencias con el informe que introdujo el PR #53

Estas diferencias no se corrigen aquí porque cambian el diseño, no solo las restricciones. Hay que decidir en equipo si se ajusta el código o el informe.

1. **Los valores aplicados ya no se congelan con la ruta.** El informe guarda `valor_aplicado` en RUTA_PARAMETRO para que cada ruta conserve la configuración con la que se generó (RF-08). Ahora `AppliedValue` está en `BalanceParameter`: si se edita un criterio, cambian también los valores de las rutas ya generadas con él.
2. **La ruta no tiene capacidad del vehículo.** Se eliminó `capacidad_vehiculo_kg`, que el informe usa para RF-07 y para la restricción de capacidad. Ahora el límite de peso solo puede expresarse como parámetro `PESO_TOTAL` del criterio.
3. **La ruta no tiene fecha de creación propia ni la revisión fecha propia.** Se eliminaron `fecha_creacion` y `fecha_hora_revision`; se usa la columna de auditoría `Created`. Ya no existe la clave única `(id_ruta, fecha_hora_revision)` que garantizaba una única «última revisión».
4. **La re-confección apunta a un criterio entero.** El supervisor indica un `BalanceCriterion` en la revisión en lugar de parámetros sueltos con `valor_indicado`, así que REVISION_PARAMETRO queda sin uso.
5. **La ruta pide el repartidor al generarse.** El informe lo asigna solo cuando la ruta está aprobada.
6. **La decisión de revisión admite `Pending`.** El informe deriva «Pendiente de aprobación» de la ausencia de revisiones y la decisión solo puede ser aprobada o rechazada.

## Restricciones del informe

### 3.1 Unicidad
Implementadas: `(id_ruta, orden_visita)`, `(id_ruta, id_pedido)` en entregas y en reprogramaciones, `id_revision_origen` único si no es nulo, antiduplicados de pedidos y un solo repartidor por ruta. Falta la de revisiones por fecha (diferencia 3).

### 3.2 Semánticas
- Dominios de todos los enumerados: añadidos como `CHECK` en esta auditoría.
- `peso_kg > 0` y `orden_visita >= 1`: ya existían. `capacidad_vehiculo_kg > 0` desapareció con la columna (diferencia 2).
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
| Coherencia ruta–parada (y capacidad, si se recupera la columna) | #11 |
| Ruta reconfeccionada del mismo centro que la revisada | #15 |
| Un repartidor sin dos rutas aprobadas el mismo día; repartidor asignado al centro | #16 |
| Fechas entre tablas: revisión posterior a la creación de la ruta, entrega posterior a la aprobación, etc. | #14, #17, #18 |

La generación automática (PR #54) ya respeta en la aplicación la coherencia ruta–parada, el centro de la ruta y el pedido vigente único (solo toma pedidos pendientes), pero eso no sustituye a los disparadores.

## Otros hallazgos fuera de alcance

- `src/Domain/Entities` contiene `NewStop`, `RouteStatus` y `RouteOrderStatus`, que no están mapeadas a la base de datos (parecen pensadas para el estado en memoria del issue #19). `RouteStatus` tiene el mismo nombre que el enumerado `Domain.Enums.RouteStatus`.
- `PriorityLevel`, `TodoItem` y `TodoList` son de la plantilla; se eliminan en el issue #26.
- La restauración de paquetes falla con la auditoría de NuGet activada (`Aspire.Hosting 13.2.0` y otros tienen vulnerabilidades conocidas); hay que actualizarlos.
