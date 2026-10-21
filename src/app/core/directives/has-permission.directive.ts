import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, inject } from '@angular/core';
import { AutenticacionServicio } from '../services/auth.service';

/**
 * *appTienePermiso="'reparaciones.autorizar'" muestra el elemento cuando el
 * usuario tiene ese permiso granular.
 * *appTienePermiso="['reparaciones.autorizar', ['Administrador','Mecanico']]"
 * también lo muestra si el usuario tiene alguno de los roles indicados, igual
 * que la validación combinada [RequierePermiso(permiso, Roles = "...")] del backend.
 */
@Directive({
  selector: '[appTienePermiso]',
  standalone: true
})
export class TienePermisoDirectiva implements OnInit {
  private plantilla = inject(TemplateRef<unknown>);
  private contenedorVista = inject(ViewContainerRef);
  private servicioAutenticacion = inject(AutenticacionServicio);

  @Input('appTienePermiso') config: string | [string, string[]] = '';

  ngOnInit(): void {
    const [permiso, roles] = Array.isArray(this.config) ? this.config : [this.config, []];
    const permitido = this.servicioAutenticacion.poseePermiso(permiso) || (roles.length > 0 && this.servicioAutenticacion.tieneRol(...roles));

    this.contenedorVista.clear();
    if (permitido) {
      this.contenedorVista.createEmbeddedView(this.plantilla);
    }
  }
}
