import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { entorno } from '../../../environments/environment';
import { Permiso } from '../models';

@Injectable({ providedIn: 'root' })
export class PermisoServicio {
  private http = inject(HttpClient);
  private urlBase = `${entorno.urlApi}/permisos`;

  obtenerCatalogo(): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(this.urlBase);
  }

  obtenerDeUsuario(idUsuario: number): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${this.urlBase}/usuario/${idUsuario}`);
  }

  asignar(idUsuario: number, idPermiso: number): Observable<void> {
    return this.http.post<void>(`${this.urlBase}/usuario/${idUsuario}`, { idPermiso });
  }

  revocar(idUsuario: number, idPermiso: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/usuario/${idUsuario}/${idPermiso}`);
  }
}
