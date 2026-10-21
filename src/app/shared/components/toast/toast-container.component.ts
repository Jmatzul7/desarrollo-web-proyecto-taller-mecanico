import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificacionServicio } from './toast.service';

@Component({
  selector: 'app-contenedor-notificaciones',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notificacion-pila">
      @for (notificacion of servicioNotificacion.notificaciones(); track notificacion.id) {
        <div class="notificacion-elemento" [class]="'notificacion-' + notificacion.tipo" role="alert">
          <span class="notificacion-icono">
            @switch (notificacion.tipo) {
              @case ('exito') { ✓ }
              @case ('error') { ✕ }
              @case ('advertencia') { ⚠ }
              @default { ℹ }
            }
          </span>
          <span class="notificacion-mensaje">{{ notificacion.texto }}</span>
          <button class="notificacion-cerrar" (click)="servicioNotificacion.descartar(notificacion.id)" aria-label="Cerrar">✕</button>
        </div>
      }
    </div>
  `,
  styleUrl: './toast-container.component.scss'
})
export class ContenedorNotificacionesComponente {
  servicioNotificacion = inject(NotificacionServicio);
}
