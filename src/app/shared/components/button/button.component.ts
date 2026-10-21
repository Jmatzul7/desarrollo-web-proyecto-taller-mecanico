import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-boton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="tipo"
      class="app-btn"
      [class]="'app-btn-' + variante + ' app-btn-' + tamano"
      [disabled]="deshabilitado || cargando || disabled"
    >
      @if (cargando) {
        <span class="app-btn-cargador"></span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styleUrl: './button.component.scss'
})
export class BotonComponente {
  @Input() variante: 'primario' | 'fantasma' | 'peligro' | 'sutil' = 'primario';
  @Input() tamano: 'sm' | 'md' = 'md';
  @Input() tipo: 'button' | 'submit' = 'button';
  @Input() deshabilitado = false;
  @Input() cargando = false;
  @Input() disabled: boolean =  false;
}
