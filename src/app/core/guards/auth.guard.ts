import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AutenticacionServicio } from '../services/auth.service';

export const guardiaAutenticacion: CanActivateFn = () => {
  const servicioAutenticacion = inject(AutenticacionServicio);
  const enrutador = inject(Router);

  if (servicioAutenticacion.estaAutenticado()) {
    return true;
  }

  enrutador.navigate(['/iniciar-sesion']);
  return false;
};

/** Evita que un usuario ya autenticado vea las pantallas de inicio de sesión y registro. */
export const guardiaInvitado: CanActivateFn = () => {
  const servicioAutenticacion = inject(AutenticacionServicio);
  const enrutador = inject(Router);

  if (!servicioAutenticacion.estaAutenticado()) {
    return true;
  }

  enrutador.navigate(['/']);
  return false;
};
