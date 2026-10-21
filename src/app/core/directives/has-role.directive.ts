import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, inject } from '@angular/core';
import { AutenticacionServicio } from '../services/auth.service';

/** *appTieneRol="['Administrador','Recepcionista']" muestra el elemento solo para esos roles. */
@Directive({
  selector: '[appTieneRol]',
  standalone: true
})
export class TieneRolDirectiva implements OnInit {
  private plantilla = inject(TemplateRef<unknown>);
  private contenedorVista = inject(ViewContainerRef);
  private servicioAutenticacion = inject(AutenticacionServicio);

  @Input('appTieneRol') roles: string[] = [];

  ngOnInit(): void {
    this.contenedorVista.clear();
    if (this.servicioAutenticacion.tieneRol(...this.roles)) {
      this.contenedorVista.createEmbeddedView(this.plantilla);
    }
  }
}
