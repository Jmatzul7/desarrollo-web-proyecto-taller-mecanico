import { Component, Input } from '@angular/core';

export type VarianteInsignia = 'neutro' | 'exito' | 'advertencia' | 'peligro' | 'informacion' | 'primario';

@Component({
  selector: 'app-insignia',
  standalone: true,
  template: `<span class="insignia" [class]="'insignia-' + variante"><ng-content></ng-content></span>`
})
export class InsigniaComponente {
  @Input() variante: VarianteInsignia = 'neutro';
}
