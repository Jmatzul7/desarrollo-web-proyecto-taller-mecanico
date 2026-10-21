# Taller Mecánico - Frontend (Angular)

Frontend en Angular 19 (componentes standalone) que consume la API REST
`TallerMecanicoAPI`. Implementa autenticación JWT, control de acceso por rol y
por permisos granulares, y una interfaz con modales para todas las operaciones
que expone la API. **Esta versión tiene el código, los nombres de archivos, los
comentarios y los textos de la interfaz en español.**

## Requisitos

- Node.js 18.19+ / 20.11+ / 22+ (probado con Node 22.22.0)
- La API `TallerMecanicoAPI` en ejecución (por defecto se espera en
  `http://localhost:5000/api`, ver `src/environments/environment.ts`)

## Instalación y ejecución

```bash
npm install
npm start           # http://localhost:4200
npm run build       # compilación de producción en dist/
```

Si tu API corre en otro puerto o host, actualiza `urlApi` en
`src/environments/environment.ts` (desarrollo) y `src/environments/environment.prod.ts` (producción).

## Arquitectura

```
src/app/
  core/                       Infraestructura transversal
    models/                   Interfaces TS que reflejan los DTOs del backend
    services/                 Un servicio HTTP por recurso (ClienteServicio, OrdenServicio, ...)
    interceptors/             auth.interceptor (adjunta el JWT) y error.interceptor
                              (traduce el { mensaje } del backend a notificaciones y
                              maneja 401/403/404/409)
    guards/                   auth.guard (guardiaAutenticacion / guardiaInvitado)
                              y permission.guard (guardiaPermiso: rol + permiso granular)
    directives/               *appTienePermiso y *appTieneRol para ocultar UI según permisos

  shared/components/          Piezas reutilizables en toda la app
    modal/                    <app-modal> - contenedor de modal reutilizable
    confirm-dialog/           Diálogo de confirmación global (ConfirmacionServicio.confirmar(...))
    toast/                    Sistema de notificaciones (NotificacionServicio)
    button/, badge/, spinner/ Componentes básicos de UI (BotonComponente, InsigniaComponente, CargadorComponente)

  layout/main-layout/         Barra lateral + barra superior, menú filtrado por rol/permiso

  features/
    auth/login                Inicio de sesión (panel dividido oscuro)
    auth/register             Autorregistro (la cuenta queda inactiva hasta que se active)
    dashboard/                Panel con métricas generales
    clientes, vehiculos       CRUD con modal de creación/edición
    ordenes/list              Listado de órdenes de trabajo con filtro por estado
    ordenes/detail            Diagnósticos, reparaciones, autorización, repuestos y factura
    repuestos                 Bodega: CRUD + entrada de stock
    facturas/list, /detail    Listado y detalle de facturas, descarga de PDF
    usuarios                  Administración de cuentas (activar/desactivar, cambiar rol)
    permisos                  Asignación/revocación de permisos granulares por usuario
    not-found                 Página 404

  environments/               Configuración por ambiente (urlApi)
```

### Convenciones

Los nombres de archivos y carpetas se mantienen como en la versión original; lo que
está en español es el **contenido**: clases, métodos, señales, comentarios y textos.

| Antes (inglés)                  | Ahora (español)                          |
|---------------------------------|------------------------------------------|
| `XComponent`, `XService`        | `XComponente`, `XServicio`               |
| `authGuard`                     | `guardiaAutenticacion`                   |
| `getAll / getById / create`     | `obtenerTodos / obtenerPorId / crear`    |
| `update / delete`               | `actualizar / eliminar`                  |
| `loading / saving`              | `cargando / guardando`                   |
| `*appHasPermission / *appHasRole` | `*appTienePermiso / *appTieneRol`      |
| Ruta `/login`                   | `/iniciar-sesion`                        |

### Lo que NO se tradujo (contrato con el backend)

Para no romper la comunicación con la API se mantienen tal cual: las URLs de los
endpoints (`/api/ordenestrabajo`, `/api/auth/login`, ...), los nombres de los
campos JSON (`nombreUsuario`, `idEstadoOrden`, ...), los verbos HTTP, los nombres
de roles (`Administrador`, `Recepcionista`, `Mecanico`, `Bodeguero`), los nombres
de permisos (`clientes.crear`, `reparaciones.autorizar`, ...), los nombres de
claims del JWT, la clave `taller_token` de `localStorage` y los sufijos propios de
Angular (`ngOnInit`, `loadComponent`, `Component` en decoradores, etc.).

## Autenticación y permisos

- El JWT se guarda en `localStorage` y se adjunta a cada petición mediante
  `interceptorAutenticacion`.
- `AutenticacionServicio` decodifica el token y expone `rol` y los claims
  `permiso` como señal (`sesion()`), reactiva en toda la app.
- La UI combina **rol** y **permisos granulares** igual que el backend
  (`[RequierePermiso]`): un botón o ruta se habilita si el usuario tiene alguno de
  los roles permitidos **o** el permiso específico:

  ```html
  <app-boton *appTienePermiso="['reparaciones.autorizar', ['Administrador','Recepcionista']]">
    Autorizar
  </app-boton>
  ```

- Las rutas administrativas (`/usuarios`, `/permisos`) usan `guardiaPermiso` con
  `data: { roles: ['Administrador'] }`.

## Manejo de errores

`interceptorErrores` lee el cuerpo `{ mensaje }` que devuelve la API y muestra una
notificación según el código HTTP (400; 401 → cierre de sesión automático; 403;
404; 409; o error de conexión). Cualquier componente puede suscribirse además al
`error` de una llamada puntual si necesita una reacción adicional.

## Notas

- Los endpoints de `core/services/*.service.ts` siguen el backend real
  (`/api/ordenestrabajo`, `/api/reparaciones/{id}/autorizar`,
  `/api/permisos/usuario/{id}`, ...). Si tu backend usa rutas distintas, ajusta
  únicamente `urlBase` en cada servicio.
- El backend responde `200 OK` sin cuerpo al crear/actualizar/eliminar (excepto
  facturas y registro), por eso tras crear se recarga la lista.
- El PDF de la factura se descarga con `GET /api/facturas/{id}/pdf` como `blob`.
- `GET /api/usuarios` es solo para Administrador: los roles no administradores
  no pueden cargar el selector de mecánicos con esa llamada.
