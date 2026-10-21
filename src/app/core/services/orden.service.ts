import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { entorno } from '../../../environments/environment';
import { OrdenTrabajo, OrdenTrabajoCrear, OrdenTrabajoEstado } from '../models';

@Injectable({ providedIn: 'root' })
export class OrdenServicio {
  private http = inject(HttpClient);
  // El controlador se llama OrdenesTrabajoController -> ruta real /api/ordenestrabajo
  private urlBase = `${entorno.urlApi}/ordenestrabajo`;

  obtenerTodos(): Observable<OrdenTrabajo[]> {
    return this.http.get<OrdenTrabajo[]>(this.urlBase);
  }

  obtenerPorId(id: number): Observable<OrdenTrabajo> {
    return this.http.get<OrdenTrabajo>(`${this.urlBase}/${id}`);
  }

  // El backend responde 200 OK sin cuerpo al crear, por lo que no devuelve la orden creada.
  crear(dto: OrdenTrabajoCrear): Observable<void> {
    return this.http.post<void>(this.urlBase, dto);
  }

  cambiarEstado(id: number, dto: OrdenTrabajoEstado): Observable<void> {
    return this.http.patch<void>(`${this.urlBase}/${id}/estado`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }
}
