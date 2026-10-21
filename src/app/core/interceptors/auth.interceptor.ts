import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AutenticacionServicio } from '../services/auth.service';

/** Adjunta el token JWT (Bearer) a cada solicitud saliente hacia la API. */
export const interceptorAutenticacion: HttpInterceptorFn = (solicitud, siguiente) => {
  const servicioAutenticacion = inject(AutenticacionServicio);
  const token = servicioAutenticacion.obtenerToken();

  if (!token) {
    return siguiente(solicitud);
  }

  return siguiente(
    solicitud.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    })
  );
};
