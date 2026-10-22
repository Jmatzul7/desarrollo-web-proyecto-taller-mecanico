# Taller Mecánico - Frontend (Angular)

Frontend en Angular que consume la API REST
`TallerMecanicoAPI`. Implementa autenticación JWT, control de acceso por rol y
por permisos granulares, y una interfaz con modales para todas las operaciones
que expone la API. 

## Requisitos

- Node.js 20.11+ / 22+ 
- La API `TallerMecanicoAPI` en ejecución (
  `http://localhost:5000/api`, ver `src/environments/environment.ts`)

## Instalación y ejecución

```bash
npm install
npm start           # http://localhost:4200
npm run build       # compilación de producción en dist/
```

Si cualquier cambio de puerto actualizar `urlApi` en
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

### Permisos por defecto de cada rol

Esto es lo que cada rol puede hacer **sin** tener ningún permiso individual asignado
(sale de `[RequierePermiso("permiso", Roles = "...")]` en cada controlador). Además, a
cualquier usuario se le puede dar un permiso suelto desde la pantalla de Permisos.

| Permiso | Administrador | Recepcionista | Mecánico | Bodeguero |
|---|:-:|:-:|:-:|:-:|
| `clientes.ver` | ✅ | ✅ | | |
| `clientes.crear` | ✅ | ✅ | | |
| `clientes.editar` | ✅ | ✅ | | |
| `clientes.eliminar` | ✅ | | | |
| `vehiculos.ver` | ✅ | ✅ | | |
| `vehiculos.crear` | ✅ | ✅ | | |
| `vehiculos.editar` | ✅ | ✅ | | |
| `vehiculos.eliminar` | ✅ | | | |
| `ordenes.crear` | ✅ | ✅ | | |
| `ordenes.cambiar_estado` | ✅ | ✅ | ✅ | |
| `ordenes.eliminar` | ✅ | | | |
| `diagnosticos.crear` | ✅ | | ✅ | |
| `diagnosticos.eliminar` | ✅ | | | |
| `reparaciones.crear` | ✅ | | ✅ | |
| `reparaciones.autorizar` | ✅ | | | |
| `reparaciones.cambiar_estado` | ✅ | | ✅ | |
| `reparaciones.eliminar` | ✅ | | | |
| `reparaciones.asignar_repuesto` | ✅ | | | ✅ |
| `reparaciones.quitar_repuesto` | ✅ | | | ✅ |
| `repuestos.ver` | ✅ | | ✅ | ✅ |
| `repuestos.crear` | ✅ | | | ✅ |
| `repuestos.editar` | ✅ | | | ✅ |
| `repuestos.entrada_stock` | ✅ | | | ✅ |
| `repuestos.eliminar` | ✅ | | | |
| `facturas.ver` | ✅ | ✅ | | |
| `facturas.generar` | ✅ | ✅ | | |
| `facturas.descargar_pdf` | ✅ | ✅ | | |
| `usuarios.ver_mecanicos` | ✅ | ✅ | ✅ | |

Sin restricción de permiso (cualquier usuario autenticado): ver y editar su propio perfil,
cambiar su contraseña, consultar los catálogos y ver órdenes, diagnósticos y reparaciones.
La gestión de usuarios y de permisos es exclusiva del **Administrador**.



## Manejo de errores

`interceptorErrores` lee el cuerpo `{ mensaje }` que devuelve la API y muestra una
notificación según el código HTTP (400; 401 → cierre de sesión automático; 403;
404; 409; o error de conexión). Cualquier componente puede suscribirse además al
`error` de una llamada puntual si necesita una reacción adicional.

## Notas

- Los endpoints de `core/services/*.service.ts` siguen el backend real
  (`/api/ordenestrabajo`, `/api/reparaciones/{id}/autorizar`,
  `/api/permisos/usuario/{id}`, ...). 
- El backend responde `200 OK` sin cuerpo al crear/actualizar/eliminar (excepto
  facturas y registro), por eso tras crear se recarga la lista.
- El PDF de la factura se descarga con `GET /api/facturas/{id}/pdf` como `blob`.
- `GET /api/usuarios` es solo para Administrador: los roles no administradores
  no pueden cargar el selector de mecánicos con esa llamada.
