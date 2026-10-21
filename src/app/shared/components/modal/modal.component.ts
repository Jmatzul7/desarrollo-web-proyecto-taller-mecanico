import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Contenedor de modal reutilizable. Cada funcionalidad mantiene su propia señal
 * de apertura y la pasa con [abierto]; el título, el cuerpo y el pie se
 * proyectan para que todos los modales de formulario/detalle compartan el mismo
 * marco, fondo y comportamiento de cierre en lugar de reimplementarlos.
 *
 * Uso:
 *   <app-modal [abierto]="mostrarFormulario()" titulo="Nuevo cliente" (cerrado)="mostrarFormulario.set(false)">
 *     <form> ... </form>
 *     <div modal-pie> <app-boton (click)="guardar()">Guardar</app-boton> </div>
 *   </app-modal>
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (abierto) {
      <div class="modal-fondo" (click)="alHacerClicEnFondo()"></div>
      <div class="modal-contenedor" role="dialog" aria-modal="true">
        <div class="modal-panel" [class]="'modal-tamano-' + tamano" (click)="$event.stopPropagation()">
          <header class="modal-encabezado">
            <h3>{{ titulo }}</h3>
            <button type="button" class="modal-cerrar" (click)="cerrar()" aria-label="Cerrar">✕</button>
          </header>
          <div class="modal-cuerpo">
            <ng-content></ng-content>
          </div>
          <footer class="modal-pie">
            <ng-content select="[modal-pie]"></ng-content>
          </footer>
        </div>
      </div>
    }
  `,
  styleUrl: './modal.component.scss'
})
export class ModalComponente {
  @Input() abierto = false;
  @Input() titulo = '';
  @Input() tamano: 'sm' | 'md' | 'lg' = 'md';
  @Input() cerrarAlHacerClicEnFondo = true;
  @Output() cerrado = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    if (this.abierto) this.cerrar();
  }

  alHacerClicEnFondo(): void {
    if (this.cerrarAlHacerClicEnFondo) this.cerrar();
  }

  cerrar(): void {
    this.cerrado.emit();
  }
}
