import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { entorno } from '../../../environments/environment';
import { Rol, EstadoOrden, EstadoReparacion, Mecanico } from '../models';

@Injectable({ providedIn: 'root' })
export class CatalogoServicio {
  private http = inject(HttpClient);
  private urlBase = `${entorno.urlApi}/catalogos`;

  obtenerRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.urlBase}/roles`);
  }

  /** Mecánicos activos. Requiere el permiso `usuarios.ver_mecanicos` (o rol Administrador/Recepcionista/Mecanico). */
  obtenerMecanicos(): Observable<Mecanico[]> {
    return this.http.get<Mecanico[]>(`${this.urlBase}/mecanicos`);
  }

  obtenerEstadosOrden(): Observable<EstadoOrden[]> {
    return this.http.get<EstadoOrden[]>(`${this.urlBase}/estados-orden`);
  }

  obtenerEstadosReparacion(): Observable<EstadoReparacion[]> {
    return this.http.get<EstadoReparacion[]>(`${this.urlBase}/estados-reparacion`);
  }
}
