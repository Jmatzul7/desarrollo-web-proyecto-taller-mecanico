import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AutenticacionServicio } from '../services/auth.service';
import { NotificacionServicio } from '../../shared/components/toast/toast.service';
import { CuerpoErrorApi } from '../models';
import { PETICION_SILENCIOSA } from './silencioso';

/**
 * Centraliza el manejo del formato de error `{ mensaje }` de la API y de los
 * códigos de estado que usa el backend (400/401/403/404/409).
 * El código de cada funcionalidad solo necesita suscribirse al canal `error`
 * de su llamada cuando requiere algo más que la notificación por defecto.
 */
export const interceptorErrores: HttpInterceptorFn = (solicitud, siguiente) => {
  const notificacion = inject(NotificacionServicio);
  const servicioAutenticacion = inject(AutenticacionServicio);
  const enrutador = inject(Router);

  return siguiente(solicitud).pipe(
    catchError((error: HttpErrorResponse) => {
      const body = error.error as CuerpoErrorApi | undefined;
      const mensaje = body?.mensaje;

      // Peticiones de fondo: solo reaccionamos al 401 (sesión inválida), sin avisos de error.
      if (solicitud.context.get(PETICION_SILENCIOSA) && error.status !== 401) {
        return throwError(() => error);
      }

      switch (error.status) {
        case 401:
          notificacion.error(mensaje ?? 'Tu sesión expiró o no has iniciado sesión.');
          servicioAutenticacion.cerrarSesion();
          break;
        case 403:
          notificacion.error(mensaje ?? 'No tienes permiso para realizar esta acción.');
          break;
        case 404:
          notificacion.error(mensaje ?? 'El recurso solicitado no fue encontrado.');
          break;
        case 409:
          notificacion.error(mensaje ?? 'La operación generó un conflicto con datos existentes.');
          break;
        case 400:
          notificacion.error(mensaje ?? 'La solicitud contiene datos inválidos.');
          break;
        case 0:
          notificacion.error('No fue posible conectar con el servidor de la API.');
          break;
        default:
          notificacion.error(mensaje ?? 'Ocurrió un error inesperado. Intenta de nuevo.');
      }

      return throwError(() => error);
    })
  );
};
