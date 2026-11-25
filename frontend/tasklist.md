# Tasklist — Frontend Smart Routes

**Objetivo:** dejar el frontend funcionando contra el backend real, sin MSW en ejecución, con contratos alineados, pruebas y documentación.

- **Rama:** `develop`
- **Fecha de creación:** 25/11/2026
- **Progreso:** 5 / 33
- **Fuente de verdad del contrato:** `docs/endpoints.md`

## Leyenda

- 🟢 Solo frontend.
- 🟡 Requiere acuerdo o cambio en backend, pero se puede avanzar.
- 🔴 Bloqueado hasta que exista endpoint o permiso en backend.

## Reglas de trabajo

1. MSW solo se permite en `src/test` como herramienta de prueba. Nunca en `src/main.tsx` ni en la aplicación.
2. `docs/endpoints.md` es la fuente de verdad: si cambia un endpoint, se actualiza ahí en el mismo cambio.
3. Nada de datos falsos en dashboard/reportes: endpoint real o pantalla “Pendiente de backend”.
4. Cada tarea termina con `npm run lint`, `npm test` y `npm run build`.
5. Marcar la tarea como `[x]` al terminarla y anotar fecha/PR.
6. Si una tarea necesita backend, dejarlo documentado en `docs/endpoints.md` y en la sección de dependencias.

## Estado de partida

- ✅ Login real contra backend.
- ✅ 19 pantallas/vistas implementadas.
- ✅ CI de frontend con lint, test y build.
- ✅ 51 pruebas pasando.
- ✅ MSW de runtime eliminado; la app arranca directo contra el backend real.
- ❌ Dashboard y reportes sin endpoint de backend.
- ❌ Contratos de pedidos, rutas, paradas y centros desalineados.
- ✅ Documentación y README alineados con el backend real.

## Decisiones abiertas

- [ ] MSW solo en tests (recomendado) o eliminar también de tests.
- [ ] Dashboard/reportes: implementar backend o mostrar “Pendiente de backend”.
- [ ] ¿Quién puede ver pedidos? Solo coordinador o ampliar backend.
- [ ] ¿Quién puede generar rutas? Solo coordinador o ampliar backend.
- [ ] ¿La clasificación de pedidos es requisito funcional?
- [ ] ¿Refresh token en `localStorage` o cookie `httpOnly`?

## Dependencias de backend

| Necesidad | Uso | Estado |
|---|---|---|
| `reviewState` o `latestReview` en `RouteDto` y filtro por última revisión | Estado real de rutas | Pendiente |
| Lectura de centros/zonas para coordinador, o endpoints de catálogo | Generar rutas y filtrar pedidos | Pendiente |
| Crear centro devolviendo ID o aceptando `coveredZoneIds` | Alta de centros con zonas | Pendiente |
| `GET /dashboard/summary` | KPIs del inicio | No existe |
| `GET /reports/{reportId}` | Seis reportes | No existe |
| Renombrar `BalanceCritertiaId` o aceptar `newBalanceCriterionId` | Rechazo con nuevo criterio | Pendiente |
| Nombre real del coordinador en reprogramaciones | Detalle de solicitud | Pendiente |
| Endpoint de clasificación/cambio de estado de pedido | Botón “Clasificar” | No existe |
| Rate limiting real (429) y cookie `httpOnly` para refresh | Seguridad | Pendiente |
| Usuario demo con 2FA habilitado | Guion de demo | Pendiente |

---

# Fase A — Quitar mocks y fijar el contrato

## 1. Crear `docs/endpoints.md` 🟢

- [x] **Completada:** 25/11/2026. Documento creado en `docs/endpoints.md` y enlazado desde `frontend/README.md`.
- Inventariar todos los endpoints de `src/Web/Endpoints`.
- Documentar por endpoint: método, ruta, roles, autenticación, query/body, respuesta 2xx, errores y notas.
- Incluir: auth, pedidos, paradas, rutas, criterios de equilibrio, administración de roles, centros, zonas, entregas y reprogramaciones.
- Marcar como pendientes: dashboard, reportes y clasificación de pedidos.
- Enlazarlo desde `frontend/README.md`.
- **Hecho cuando:** cada función de `frontend/src/api/*.ts` aparece en el documento y los pendientes están identificados.

## 2. Migrar los tests fuera de `src/mocks` 🟢

- [x] **Completada:** 25/11/2026. Los tests usan `src/test/handlers/` y `src/test/server.ts`; sin imports de `src/mocks`.
- Crear `frontend/src/test/handlers/` con handlers que reflejen el backend real.
- Reescribir `PedidosPage.test.tsx`, `ParadasPage.test.tsx` y `RutasPage.test.tsx`.
- Quitar imports de `mockState`, `tokensFor` y `src/mocks/*`.
- Ajustar los tokens de prueba a un valor simple; los handlers no deben depender de usuarios mock.
- **Hecho cuando:** `npm test` pasa sin importar nada de `src/mocks`.

## 3. Eliminar los mocks de ejecución 🟢

- [x] **Completada:** 25/11/2026. `main.tsx` renderiza directo, `src/mocks/` y el service worker fueron eliminados.
- `src/main.tsx`: render directo, sin `enableMocking`, `resolveMockModules` ni import dinámico.
- Borrar `frontend/src/mocks/` completa.
- Borrar `frontend/public/mockServiceWorker.js`.
- `package.json`: quitar el bloque `msw.workerDirectory`; conservar `msw` solo si se usa en tests.
- Quitar `VITE_ENABLE_MOCKS` y `VITE_MOCKS` de `.env.example` y del `.env.development` local.
- Ejecutar `npm install` para actualizar `package-lock.json`.
- **Hecho cuando:** `grep` no encuentra referencias a MSW fuera de `src/test`, y la app arranca sin service worker.

## 4. Limpiar documentación y comentarios 🟢

- [x] **Completada:** 25/11/2026. README reescrito contra el backend real y comentarios de `auth.api.ts`, `http.ts`, `orders.api.ts` y `TwoFactorPage` actualizados.
- `frontend/README.md`: quitar la sección de MSW, las variables de entorno, los usuarios mock y la tabla antigua de endpoints.
- Enlazar `docs/endpoints.md` y describir el estado real.
- Actualizar comentarios como “los mismos que definimos en MSW” en `src/api/auth.api.ts`.
- **Hecho cuando:** no quedan menciones a MSW o `VITE_ENABLE_MOCKS` en la documentación del frontend.

## 5. Resolver dashboard y reportes sin mocks 🟡

- [x] **Completada:** 25/11/2026. Dashboard/reportes muestran “Pendiente de backend” sin llamar endpoints inexistentes; flags en `src/api/capabilities.ts`. Reporte real de entregas por centro se mantiene.
- Si backend implementa `GET /dashboard/summary` y `GET /reports/{reportId}`, conectarlos.
- Si no existen: mostrar un estado claro de “Pendiente de backend” y ocultar/deshabilitar selectores que no tengan datos.
- Mantener el reporte real de “Entregas por centro” (`/delivery/reports/by-center`).
- No inventar cifras ni dejar errores 404 visibles.
- **Hecho cuando:** ninguna pantalla llama a un endpoint inexistente sin manejarlo.

## 6. Smoke test con backend real por rol 🟢

- Probar con Ana, Carlos, Sofía y Marco.
- Recorrer todas las pantallas y anotar 401, 403, 404, pantallas vacías y botones sin acción.
- **Hecho cuando:** existe una matriz rol × pantalla con el estado real.

## 7. Actualizar guion de demo y README 🟢

- Usuarios reales del seed (`ana@demo.dev`, `carlos@demo.dev`, `sofia@demo.dev`, `marco@demo.dev`).
- Aclarar que el 2FA no está habilitado por defecto.
- Aclarar que el 429 no está implementado en backend.
- Corregir la recuperación de contraseña: el token se escribe en el log del servidor, no en la consola del navegador.
- **Hecho cuando:** el guion de demo se puede ejecutar tal cual sin pasos falsos.

---

# Fase B — Contratos P0

## 8. Pedidos: array + cabeceras de paginación 🟢

- El backend devuelve `OrderResponse[]` y la paginación en `X-Total-Count`, `X-Page-Number`, `X-Page-Size`.
- Cambiar `ordersApi.list` para construir `OrdersPage` desde `response.data` y `response.headers`.
- Cambiar `ordersApi.create` para devolver `Order` en vez de `number`.
- Ajustar `PedidosPage` y las pruebas.
- **Archivo:** `frontend/src/api/orders.api.ts`, `frontend/src/pages/PedidosPage.tsx`.
- **Hecho cuando:** con backend real la tabla muestra pedidos, total y páginas.

## 9. Mostrar el estado real de las rutas 🟡

- Añadir `reviewState` o `latestReview` al tipo `Route` cuando backend lo exponga.
- Mostrar el badge por fila; no usar el estado del filtro como estado de la ruta.
- Panel de revisión solo para rutas pendientes.
- Mientras no exista el campo: mostrar `—` en el filtro “Todos” y no inventar “Pendiente”.
- **Archivos:** `frontend/src/pages/RutasPage.tsx`, `frontend/src/api/routes.api.ts`.
- **Hecho cuando:** cada ruta muestra su estado real o `—`.

## 10. Enviar bien el criterio de reconfección 🟢

- El frontend envía `newBalanceCriterionId`; el backend espera `balanceCritertiaId` o `balanceCriteria`.
- Ajustar `AddReviewPayload` y `submitReview` al nombre acordado.
- Añadir prueba de rechazo con criterio.
- **Archivo:** `frontend/src/pages/RutasPage.tsx`.
- **Hecho cuando:** el backend recibe el criterio y la ruta se reconfecciona.

## 11. Catálogo de centros y zonas para el coordinador 🟡

- Centralizar el catálogo en una query reutilizable.
- Sustituir el input numérico de centro por un `select` en pedidos y rutas.
- Usar las zonas reales en `ParadasPage`; eliminar la lista `ZONES` hardcodeada.
- Manejar el 403 si backend todavía no permite la lectura.
- **Archivos:** `frontend/src/api/centers.api.ts`, `frontend/src/pages/PedidosPage.tsx`, `frontend/src/pages/RutasPage.tsx`, `frontend/src/pages/ParadasPage.tsx`.
- **Hecho cuando:** Ana puede seleccionar centro y zona sin escribir IDs a mano.

## 12. Alinear navegación, botones y permisos 🟢/🟡

- Revisar la matriz de permisos con el equipo.
- “Pedidos” se muestra a todos, pero el backend solo deja listar al coordinador.
- El administrador ve “Generar ruta”, pero el backend solo lo permite al coordinador.
- Reprogramaciones se muestra a roles que pueden ver la lista vacía.
- Actualizar `navConfig`, `RequireRole` y los botones.
- **Hecho cuando:** ninguna opción visible termina en 403.

## 13. Añadir estado reutilizable de “Sin permisos” 🟢

- Crear un componente o página para 403.
- Aplicarlo en las pantallas protegidas.
- **Hecho cuando:** el usuario entiende que no tiene permiso, no que “algo falló”.

## 14. Corregir la URL de refresh 🟢

- Hoy está hardcodeada a `/api/auth/refresh` e ignora `VITE_API_URL`.
- Usar la misma base o una instancia axios específica para refresh.
- Añadir prueba con base relativa y absoluta.
- **Archivo:** `frontend/src/api/http.ts`.
- **Hecho cuando:** el refresh funciona en desarrollo y con URL absoluta.

## 15. Cerrar sesión tras cambiar contraseña 🟢

- El backend revoca los refresh tokens; la UI debe limpiar tokens y redirigir al login.
- **Archivo:** `frontend/src/pages/ProfilePage.tsx`.
- **Hecho cuando:** no queda una sesión zombie tras el cambio.

---

# Fase C — Correcciones P1

## 16. Ajustar tipos de paradas a 204 🟢

- `POST /api/stops/create-stop` y `PUT /api/stops/{id}` devuelven `204`.
- Cambiar `create` y `update` a `Promise<void>`.
- Ajustar pruebas.
- **Archivo:** `frontend/src/api/stops.api.ts`.

## 17. Guardar zonas al crear un centro 🟡

- `CreateDistributionCenter` devuelve `204`, no acepta `coveredZoneIds` y no devuelve el ID.
- Opción A: crear, buscar por nombre y actualizar/asociar zonas.
- Opción B: pedir a backend que acepte zonas y devuelva el ID.
- **Archivos:** `frontend/src/api/centers.api.ts`, `frontend/src/pages/CentrosPage.tsx`.
- **Hecho cuando:** las zonas elegidas quedan guardadas al crear el centro.

## 18. Mejorar reprogramaciones 🟢/🟡

- El backend devuelve siempre `"Coordinador"` como nombre; mostrar el nombre real cuando lo envíe.
- Mostrar “Resolver” solo al coordinador asignado.
- Añadir confirmación y errores claros.
- **Archivos:** `frontend/src/pages/ReschedulingsPage.tsx`, `frontend/src/api/reschedulings.api.ts`.

## 19. Corregir recuperación de contraseña 🟢

- La pantalla dice “consola del navegador”, pero el token está en el log del servidor.
- Usar el token de desarrollo para mostrar un enlace directo o corregir el texto.
- **Archivo:** `frontend/src/pages/auth/ForgotPasswordPage.tsx`.

## 20. Pasada completa de errores y estados 🟢

- Revisar 400, 401, 403, 404, 409, 429 y error de red en cada mutación.
- Usar `applyApiErrors` donde haya campos.
- Revisar estados de carga, vacío y botones deshabilitados.
- **Hecho cuando:** ningún `catch` silencioso deja al usuario sin explicación.

## 21. Decidir qué hacer con “Clasificar” 🟡

- Si no está en el alcance, eliminar el botón.
- Si está, conectarlo cuando exista el endpoint.
- **Archivo:** `frontend/src/pages/PedidosPage.tsx`.

## 22. Revisar el mapa 🟢

- Rutas sin coordenadas, sin paradas o sin path.
- Errores de OSRM y estados de carga.
- Opcional: usar `/routes/{id}/map` en la vista del repartidor.
- **Archivos:** `frontend/src/components/RouteMap.tsx`, `frontend/src/pages/RutasPage.tsx`.

## 23. Limpiar código muerto y assets 🟢

- `DeliveryReportsView` es inalcanzable desde `RutasPage`.
- `ZONES` hardcodeado en `stops.api.ts`.
- `react.svg`, `vite.svg` y `App.css` si no se usan.
- **Archivos:** `frontend/src/pages/DeliveryRoutePage.tsx`, `frontend/src/api/stops.api.ts`, `frontend/src/assets/`.

## 24. Alinear Zod y accesibilidad básica 🟢

- Peso > 0, fechas, observación obligatoria al rechazar/fallar, edad mínima y longitudes.
- Labels en inputs, `aria-*` en tablas/modales, foco visible y navegación por teclado.
- **Hecho cuando:** los formularios principales se recorren solo con teclado.

## 25. Decidir el almacenamiento del refresh token 🟡

- Si backend implementa cookie `httpOnly`: usar `withCredentials` y quitar el token de `localStorage`.
- Si no: documentar el riesgo y la decisión.
- **Archivo:** `frontend/src/api/http.ts`.

---

# Fase D — Pruebas

## 26. Añadir pruebas de los contratos corregidos 🟢

- Pedidos con array + cabeceras.
- Paradas 204.
- Payload de revisión.
- Estado de ruta.
- Refresh con `VITE_API_URL`.
- Logout tras cambio de contraseña.

## 27. Alinear los handlers de test con el backend real 🟢

- `src/test/handlers` debe reflejar el contrato documentado en `docs/endpoints.md`.
- Nada de `src/mocks`.
- **Hecho cuando:** los tests no esconden diferencias de contrato.

## 28. Añadir E2E con Playwright 🟢

- Coordinador: crear pedido y generar ruta.
- Supervisor: aprobar y rechazar.
- Repartidor: registrar entrega e incidencia.
- Reprogramación: solicitar y resolver.
- Administrador: gestionar roles y centros.
- Reportes: consultar y exportar.
- Usar backend real con datos seed.

## 29. Integrar E2E y smoke de contrato en CI 🟢

- Job de Playwright que levante backend + frontend.
- Mantener lint/test/build.
- Opcional: script que arranque el frontend sin MSW y verifique que cada endpoint responde con la forma esperada.

---

# Fase E — Pulido y entrega

## 30. Modo oscuro y transiciones 🟢

- ThemeProvider, toggle persistido y clases Tailwind.
- Gráficos y mapa adaptados.
- Framer Motion en rutas, modales y listas, respetando `prefers-reduced-motion`.

## 31. Rendimiento y Lighthouse 🟢

- Lazy loading de páginas.
- Imports dinámicos de Leaflet, Recharts, jsPDF y html2canvas.
- Revisar bundle y ejecutar Lighthouse.

## 32. Documentación final 🟢

- `frontend/README.md` con estado real, usuarios, limitaciones y enlaces.
- `docs/endpoints.md` completo y actualizado.
- Documentar pendientes de backend y decisiones tomadas.

## 33. QA final 🟢

- Matriz de los cuatro roles y capturas/video para la defensa.
- Responsive en móvil, tablet y escritorio.
- Revisión en Chrome y Firefox.
- Revisión de seguridad del frontend: tokens, XSS, mensajes de error y dependencias.
- Limpieza final del repo.

---

# Definición de “frontend terminado”

- [ ] Con MSW eliminado, los cuatro roles completan sus flujos contra el backend real.
- [ ] Ninguna pantalla muestra un 4xx provocado por un contrato desalineado.
- [ ] No hay botones muertos ni acciones que terminen en 403 sin explicación.
- [ ] `npm run lint`, `npm test` y `npm run build` pasan.
- [ ] El E2E de los flujos principales pasa.
- [ ] `docs/endpoints.md` coincide con el backend.
- [ ] Los pendientes de backend están documentados con responsable.
- [ ] Dashboard y reportes funcionan o están claramente marcados como pendientes, sin datos falsos.

# Ruta crítica

1. Tarea 1: `docs/endpoints.md`.
2. Tarea 2: migrar tests.
3. Tarea 3: eliminar runtime mocks.
4. Tarea 4: limpiar documentación.
5. Tarea 6: smoke test real.
6. Tarea 8: contrato de pedidos.
7. Tarea 9: estado de rutas.
8. Tarea 11: centros y zonas.
9. Tarea 12: permisos.
10. Tarea 5: dashboard y reportes.
11. Tareas 26 a 29: pruebas y CI.
12. Tareas 30 a 33: pulido y entrega.
