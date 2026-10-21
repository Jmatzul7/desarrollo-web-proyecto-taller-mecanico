import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmacionServicio } from './confirm.service';

@Component({
  selector: 'app-dialogo-confirmacion',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (servicioConfirmacion.estadoDialogo().abierto) {
      <div class="modal-fondo" (click)="servicioConfirmacion.resolver(false)"></div>
      <div class="confirmacion-contenedor">
        <div class="confirmacion-panel" (click)="$event.stopPropagation()">
          <h3>{{ servicioConfirmacion.estadoDialogo().titulo }}</h3>
          <p>{{ servicioConfirmacion.estadoDialogo().texto }}</p>
          <div class="confirmacion-acciones">
            <button type="button" class="btn-fantasma" (click)="servicioConfirmacion.resolver(false)">
              {{ servicioConfirmacion.estadoDialogo().textoCancelar }}
            </button>
            <button
              type="button"
              class="btn-solido"
              [class.btn-peligro]="servicioConfirmacion.estadoDialogo().variante === 'peligro'"
              (click)="servicioConfirmacion.resolver(true)"
            >
              {{ servicioConfirmacion.estadoDialogo().textoConfirmar }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './confirm-dialog.component.scss'
})
export class DialogoConfirmacionComponente {
  servicioConfirmacion = inject(ConfirmacionServicio);
}
