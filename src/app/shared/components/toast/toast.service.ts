import { Injectable, signal } from '@angular/core';

export type TipoNotificacion = 'exito' | 'error' | 'advertencia' | 'informacion';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  texto: string;
}

let siguienteId = 1;

@Injectable({ providedIn: 'root' })
export class NotificacionServicio {
  readonly notificaciones = signal<Notificacion[]>([]);

  mostrar(texto: string, tipo: TipoNotificacion = 'informacion', duracionMs = 4500): void {
    const notificacion: Notificacion = { id: siguienteId++, tipo, texto };
    this.notificaciones.update((lista) => [...lista, notificacion]);
    setTimeout(() => this.descartar(notificacion.id), duracionMs);
  }

  exito(texto: string): void {
    this.mostrar(texto, 'exito');
  }

  error(texto: string): void {
    this.mostrar(texto, 'error', 6000);
  }

  advertencia(texto: string): void {
    this.mostrar(texto, 'advertencia');
  }

  informacion(texto: string): void {
    this.mostrar(texto, 'informacion');
  }

  descartar(id: number): void {
    this.notificaciones.update((lista) => lista.filter((n) => n.id !== id));
  }
}
