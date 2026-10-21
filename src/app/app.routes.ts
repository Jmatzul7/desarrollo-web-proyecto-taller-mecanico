import { Routes } from '@angular/router';
import { guardiaAutenticacion, guardiaInvitado } from './core/guards/auth.guard';
import { guardiaPermiso } from './core/guards/permission.guard';
import { PERMISOS } from './core/models';

export const routes: Routes = [
  {
    path: 'iniciar-sesion',
    canActivate: [guardiaInvitado],
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.InicioSesionComponente)
  },
  {
    path: 'registro',
    canActivate: [guardiaInvitado],
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegistroComponente)
  },
  {
    path: '',
    canActivate: [guardiaAutenticacion],
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then((m) => m.DisposicionPrincipalComponente),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.PanelComponente)
      },
      {
        path: 'clientes',
        canActivate: [guardiaPermiso],
        data: { ...PERMISOS.CLIENTES_VER },
        loadComponent: () => import('./features/clientes/clientes.component').then((m) => m.ClientesComponente)
      },
      {
        path: 'vehiculos',
        canActivate: [guardiaPermiso],
        data: { ...PERMISOS.VEHICULOS_VER },
        loadComponent: () => import('./features/vehiculos/vehiculos.component').then((m) => m.VehiculosComponente)
      },
      {
        path: 'ordenes',
        loadComponent: () =>
          import('./features/ordenes/list/ordenes.component').then((m) => m.OrdenesComponente)
      },
      {
        path: 'ordenes/:id',
        loadComponent: () =>
          import('./features/ordenes/detail/orden-detail.component').then((m) => m.OrdenDetalleComponente)
      },
      {
        path: 'repuestos',
        canActivate: [guardiaPermiso],
        data: { ...PERMISOS.REPUESTOS_VER },
        loadComponent: () => import('./features/repuestos/repuestos.component').then((m) => m.RepuestosComponente)
      },
      {
        path: 'facturas',
        canActivate: [guardiaPermiso],
        data: { ...PERMISOS.FACTURAS_VER },
        loadComponent: () =>
          import('./features/facturas/list/facturas.component').then((m) => m.FacturasComponente)
      },
      {
        path: 'facturas/:id',
        canActivate: [guardiaPermiso],
        data: { ...PERMISOS.FACTURAS_VER },
        loadComponent: () =>
          import('./features/facturas/detail/factura-detail.component').then((m) => m.FacturaDetalleComponente)
      },
      {
        path: 'usuarios',
        canActivate: [guardiaPermiso],
        data: { roles: ['Administrador'] },
        loadComponent: () => import('./features/usuarios/usuarios.component').then((m) => m.UsuariosComponente)
      },
      {
        path: 'permisos',
        canActivate: [guardiaPermiso],
        data: { roles: ['Administrador'] },
        loadComponent: () => import('./features/permisos/permisos.component').then((m) => m.PermisosComponente)
      },
      {
        path: 'permisos/:idUsuario',
        canActivate: [guardiaPermiso],
        data: { roles: ['Administrador'] },
        loadComponent: () => import('./features/permisos/permisos.component').then((m) => m.PermisosComponente)
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NoEncontradoComponente)
  }
];
