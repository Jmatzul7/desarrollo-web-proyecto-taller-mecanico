import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AutenticacionServicio } from '../services/auth.service';
import { NotificacionServicio } from '../../shared/components/toast/toast.service';

export interface DatosGuardiaPermiso {
  /** Roles que siempre pasan, igual que `[RequierePermiso(Roles = "...")]` del backend. */
  roles?: string[];
  /** Nombre del permiso granular que también deja pasar aunque no tenga un rol listado. */
  permiso?: string;
}

/**
 * Guardia de ruta que replica la autorización híbrida rol + permiso del backend.
 * Se configura con los datos de la ruta: { roles: ['Administrador'], permiso: 'reparaciones.autorizar' }
 */
export const guardiaPermiso: CanActivateFn = (ruta) => {
  const servicioAutenticacion = inject(AutenticacionServicio);
  const enrutador = inject(Router);
  const notificacion = inject(NotificacionServicio);

  const datos = ruta.data as DatosGuardiaPermiso;
  const roles = datos.roles ?? [];
  const permiso = datos.permiso;

  const permitido = (roles.length > 0 && servicioAutenticacion.tieneRol(...roles)) ||
    (!!permiso && servicioAutenticacion.poseePermiso(permiso));

  if (permitido) {
    return true;
  }

  notificacion.error('No tienes permiso para acceder a esta sección.');
  enrutador.navigate(['/']);
  return false;
};
