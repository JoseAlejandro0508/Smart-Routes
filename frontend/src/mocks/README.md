# Mocks de MSW

Guía para activar, desactivar y probar a mano los datos simulados del frontend.

MSW intercepta las peticiones en el navegador mediante un _service worker_. El
backend no necesita estar corriendo. Cada módulo funcional tiene su propio
archivo de handlers, de modo que se puede retirar el mock de un módulo sin tocar
los demás.

## Estructura

```
src/mocks/
├── README.md        # esta guía
├── browser.ts       # createMockWorker(modules): arranca el worker con los módulos pedidos
├── config.ts        # MOCK_MODULES y resolveMockModules() (VITE_ENABLE_MOCKS + VITE_MOCKS)
├── db.ts            # usuarios de prueba, tokens y retos de 2FA (en memoria)
├── shared.ts        # utilidades comunes: latencia, JWT falso, usuario autenticado
├── state.ts         # estado mutable compartido (pedidos, rutas, reportes, etc.)
└── handlers/
    ├── index.ts     # mapa módulo → handlers
    ├── auth.ts      # 9 endpoints de sesión y credenciales
    ├── dashboard.ts # 1 endpoint
    ├── orders.ts    # 2 endpoints
    ├── routes.ts    # 3 endpoints
    ├── deliveries.ts# 2 endpoints
    ├── reschedulings.ts # 3 endpoints
    ├── admin.ts     # 3 endpoints
    └── reports.ts   # 1 endpoint
```

- `db.ts` y `state.ts` viven solo en memoria: al recargar la página se
  reinician (como reiniciar el backend real). La única excepción son los tokens
  de restablecimiento, que se guardan en `sessionStorage` con la clave
  `mock.resetTokens` para sobrevivir a un F5.
- `mockServiceWorker.js` está en `public/` y lo genera MSW; no se edita a mano.

## Activar y desactivar

Hay dos variables de entorno, ambas de Vite (leen de `.env`, `.env.development`,
etc. o de la línea de comandos):

| Variable | Valores | Efecto |
|---|---|---|
| `VITE_ENABLE_MOCKS` | `true` / cualquier otra cosa | Interruptor maestro. Solo con el valor exacto `true` se activa MSW. |
| `VITE_MOCKS` | lista separada por comas; vacía o ausente | Módulos que se mockean. Vacía/ausente = **todos**. |

Reglas:

- `VITE_ENABLE_MOCKS=false` (o sin definir) → **no se arranca el worker** y todas
  las peticiones van a la API real, aunque `VITE_MOCKS` tenga módulos.
- `VITE_ENABLE_MOCKS=true` y `VITE_MOCKS` vacía → se mockean los 8 módulos.
- `VITE_ENABLE_MOCKS=true` y `VITE_MOCKS=auth,orders` → solo esos dos; el resto
  sale a la red.
- Los nombres se recortan y se pasan a minúsculas (`auth, ORDERS` funciona).
- Un nombre desconocido se ignora con un `console.warn`.
- Si ninguno de los nombres es válido, no se arranca el worker (equivale a
  desactivar los mocks).

Los cambios de entorno **requieren reiniciar** `npm run dev`.

### Con un archivo de entorno

```bash
cp .env.example .env.development
```

`.env.development` está gitignorado. Ejemplo:

```env
VITE_API_URL=/api
VITE_ENABLE_MOCKS=true
VITE_MOCKS=auth,orders
```

### Solo para un comando

```bash
VITE_ENABLE_MOCKS=true VITE_MOCKS=auth npm run dev
```

### Apagar los mocks

```bash
VITE_ENABLE_MOCKS=false npm run dev
# o simplemente no definir VITE_ENABLE_MOCKS
```

## Módulos y endpoints

| Módulo | Método y ruta |
|---|---|
| `auth` | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/2fa/verify`, `POST /api/auth/2fa/resend`, `POST /api/auth/refresh`, `POST /api/auth/forgot`, `POST /api/auth/reset`, `POST /api/auth/change-password`, `GET /api/auth/me` |
| `dashboard` | `GET /api/dashboard/summary` |
| `orders` | `GET /api/orders`, `POST /api/orders` |
| `routes` | `GET /api/routes`, `POST /api/routes/generate`, `POST /api/routes/:id/review` |
| `deliveries` | `GET /api/delivery/routes`, `POST /api/delivery/routes/:routeId/stops/:orderId` |
| `reschedulings` | `GET /api/reschedulings`, `POST /api/reschedulings`, `POST /api/reschedulings/:id/resolve` |
| `admin` | `GET /api/admin/getallusersroles`, `PUT /api/admin/addrole`, `DELETE /api/admin/deleterole/:userId` |
| `reports` | `GET /api/reports/:reportId` |

> `reschedulings` consulta `assignedRoutes` para completar la descripción del
> pedido. Si `deliveries` está desmockeado, esa descripción puede caer en el
> texto de reserva (`Pedido #<id>`).

## Usuarios de prueba

Todos usan la contraseña `Password123!`.

| Usuario | Rol | 2FA | Uso típico |
|---|---|---|---|
| `ana@demo.dev` | `LogisticsCoordinator` | Sí (`123456`) | Crear pedidos y generar rutas |
| `carlos@demo.dev` | `Administrator` | No | Gestionar roles |
| `sofia@demo.dev` | `OperationsSupervisor` | No | Revisar y aprobar rutas |
| `marco@demo.dev` | `DeliveryPerson` | No | Registrar entregas y reprogramaciones |

Cuando Ana inicia sesión, el código de 2FA (`123456`) se imprime en la consola
del navegador como `[MOCK] Código 2FA para ana@demo.dev: 123456`.

## Pruebas manuales

Abre `http://localhost:5173` con las DevTools en **Console** y **Network**.

### 1. Todos los mocks activos

```bash
VITE_ENABLE_MOCKS=true npm run dev
```

Esperado:

- En consola: `[MSW] Módulos simulados: auth, dashboard, orders, routes, deliveries, reschedulings, admin, reports`.
- En **Application → Service workers** aparece `mockServiceWorker.js` como
  `activated and is running`.
- Se puede iniciar sesión con cualquiera de los cuatro usuarios.
- Las peticiones de la app aparecen en **Network** con la columna Size como
  `(from service worker)`.

### 2. Solo un módulo

```bash
VITE_ENABLE_MOCKS=true VITE_MOCKS=auth npm run dev
```

Esperado:

- En consola: `[MSW] Módulos simulados: auth`.
- Login, `me`, refresh, logout y cambio de contraseña funcionan contra el mock.
- `GET /api/orders`, `GET /api/dashboard/summary`, etc. **salen a la red**. Si el
  backend real no está corriendo o no tiene esos endpoints, se verá el error de
  red/404 correspondiente. En consola MSW avisa con
  `[MSW] Warning: intercepted a request without a matching request handler:`
  (el worker se inicia con `onUnhandledFrame: 'warn'`).

### 3. Varios módulos

```bash
VITE_ENABLE_MOCKS=true VITE_MOCKS=auth,orders npm run dev
```

Esperado: login y pedidos mockeados; el resto a la red.

### 4. Nombre desconocido y espacios

```bash
VITE_ENABLE_MOCKS=true VITE_MOCKS=" auth , ORDERS ,nope " npm run dev
```

Esperado:

- En consola: `[MSW] Módulos desconocidos en VITE_MOCKS: nope` y después
  `[MSW] Módulos simulados: auth, orders`.
- `auth` y `orders` se mockean; `nope` se ignora.

### 5. Mocks apagados

```bash
VITE_ENABLE_MOCKS=false npm run dev
```

Esperado: no aparece ningún mensaje `[MSW]`, no se registra el service worker y
todas las peticiones van a la API real (`VITE_API_URL`, `/api` por defecto).

### 6. Flujo completo por rol (con todo mockeado)

1. **Ana** (`ana@demo.dev`): login → código `123456` → crear un pedido →
   generar una ruta.
2. **Sofía** (`sofia@demo.dev`): login → rutas → aprobar o rechazar la ruta
   (al rechazar, la observación es obligatoria).
3. **Marco** (`marco@demo.dev`): login → rutas asignadas → registrar una entrega
   (una entrega fallida exige observación) → solicitar una reprogramación.
4. **Ana**: resolver la reprogramación como coordinadora.
5. **Carlos** (`carlos@demo.dev`): login → administración → asignar y quitar un
   rol.

### 7. Resetear el estado

- Recarga normal (`F5`): se reinician `db.ts` y `state.ts`; los datos creados
  durante la prueba desaparecen.
- Para borrar también los tokens de restablecimiento persistidos:

  ```js
  sessionStorage.removeItem('mock.resetTokens')
  ```

- Si cambiaste handlers o variables de entorno: reinicia `npm run dev` y haz una
  recarga forzada (`Ctrl+Shift+R`). Si el service worker queda con una versión
  vieja, en **Application → Service workers** pulsa **Update** o
  **Unregister**.

## Quitar un módulo cuando ya exista en el backend

Mientras el endpoint real conviva con el mock, basta con **no listarlo** en
`VITE_MOCKS` (o listar solo los que siguen mockeados).

Para retirarlo definitivamente del código:

1. Borra su archivo en `src/mocks/handlers/`.
2. Elimina su entrada de `handlersByModule` en `src/mocks/handlers/index.ts`.
3. Elimina su nombre de `MOCK_MODULES` en `src/mocks/config.ts`.

El tipo `satisfies Record<MockModule, RequestHandler[]>` de `index.ts` obliga a
que el mapa y la lista de módulos sigan sincronizados: si falta uno, el build
falla.

## Problemas comunes

| Síntoma | Causa probable |
|---|---|
| No aparece `[MSW]` en consola | `VITE_ENABLE_MOCKS` no es exactamente `true`. |
| `[MSW] Módulos desconocidos...` | Nombre mal escrito o inexistente en `VITE_MOCKS`. |
| Un endpoint concreto sale a la red | Su módulo no está en `VITE_MOCKS`. |
| Los cambios de `.env` no se aplican | Hay que reiniciar el servidor de desarrollo. |
| El service worker sirve handlers viejos | Recarga forzada o **Update/Unregister** en DevTools. |
| `401 No autorizado` en un módulo mockeado | Falta el `Authorization: Bearer` o el token no corresponde a un usuario de `db.users`. |
| `403` con un usuario válido | El handler exige otro rol (por ejemplo, solo `Administrator` puede tocar roles). |

## Deuda pendiente

El proyecto todavía no tiene un runner de tests. `resolveMockModules()` en
`config.ts` es una función pura y se cubriría con un `config.test.ts` cuando se
incorpore Vitest; hasta entonces, la matriz de la sección **Pruebas manuales**
es la verificación de referencia.
