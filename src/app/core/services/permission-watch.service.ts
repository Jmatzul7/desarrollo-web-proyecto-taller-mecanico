import { Injectable, inject, signal } from '@angular/core';
import { AutenticacionServicio } from './auth.service';
import { PermisoServicio } from './permiso.service';
import { NotificacionServicio } from '../../shared/components/toast/toast.service';
import { SesionUsuario } from '../models';

const INTERVALO_MS = 20_000;

/**
 * Mantiene la sesión sincronizada con los permisos reales del usuario.
 *
 * Los permisos viajan dentro del JWT, así que sin este servicio un cambio hecho por
 * un Administrador solo se vería al volver a iniciar sesión. Aquí se pide un token
 * nuevo cada pocos segundos (y al volver a la pestaña); si cambió el rol o los
 * permisos, se avisa al usuario y los menús/botones se actualizan solos.
 */
@Injectable({ providedIn: 'root' })
export class VigilanciaPermisosServicio {
  private servicioAutenticacion = inject(AutenticacionServicio);
  private servicioPermiso = inject(PermisoServicio);
  private notificacion = inject(NotificacionServicio);

  /** nombre del permiso -> descripción legible (del catálogo del backend). */
  readonly descripciones = signal<Record<string, string>>({});

  private temporizador: ReturnType<typeof setInterval> | null = null;
  private enCurso = false;
  private alVolverALaPestana = () => {
    if (document.visibilityState === 'visible') this.refrescar();
  };

  iniciar(): void {
    if (this.temporizador) return;
    this.cargarDescripciones();
    this.temporizador = setInterval(() => this.refrescar(), INTERVALO_MS);
    document.addEventListener('visibilitychange', this.alVolverALaPestana);
  }

  detener(): void {
    if (this.temporizador) clearInterval(this.temporizador);
    this.temporizador = null;
    document.removeEventListener('visibilitychange', this.alVolverALaPestana);
  }

  /** Descripción legible de un permiso (o su nombre técnico si no se conoce). */
  descripcion(nombre: string): string {
    return this.descripciones()[nombre] ?? nombre;
  }

  refrescar(): void {
    if (this.enCurso || !this.servicioAutenticacion.estaAutenticado()) return;

    const antes = this.servicioAutenticacion.sesion();
    this.enCurso = true;
    this.servicioAutenticacion.refrescarSesion().subscribe({
      next: () => {
        this.enCurso = false;
        this.avisarCambios(antes, this.servicioAutenticacion.sesion());
      },
      error: () => (this.enCurso = false)
    });
  }

  private cargarDescripciones(): void {
    this.servicioPermiso.obtenerCatalogo().subscribe({
      next: (catalogo) => {
        const mapa: Record<string, string> = {};
        for (const p of catalogo) mapa[p.nombre] = p.descripcion ?? p.nombre;
        this.descripciones.set(mapa);
      }
    });
  }

  private avisarCambios(antes: SesionUsuario | null, despues: SesionUsuario | null): void {
    if (!antes || !despues || antes.idUsuario !== despues.idUsuario) return;

    if (antes.rol !== despues.rol) {
      this.notificacion.informacion(`Tu rol cambió: ahora eres ${despues.rol}.`);
    }

    const nuevos = despues.permisos.filter((p) => !antes.permisos.includes(p));
    const quitados = antes.permisos.filter((p) => !despues.permisos.includes(p));

    if (nuevos.length > 0) {
      this.notificacion.exito(
        `Se te asignó ${nuevos.length === 1 ? 'un permiso' : nuevos.length + ' permisos'}: ` +
          `${nuevos.map((p) => this.descripcion(p)).join('; ')}.`
      );
    }
    if (quitados.length > 0) {
      this.notificacion.advertencia(
        `Se te retiró ${quitados.length === 1 ? 'un permiso' : quitados.length + ' permisos'}: ` +
          `${quitados.map((p) => this.descripcion(p)).join('; ')}.`
      );
    }
  }
}
