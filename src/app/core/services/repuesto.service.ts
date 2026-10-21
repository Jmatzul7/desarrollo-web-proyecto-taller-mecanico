import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { entorno } from '../../../environments/environment';
import { Repuesto, RepuestoCrear, RepuestoActualizar, RepuestoAjusteStock } from '../models';

@Injectable({ providedIn: 'root' })
export class RepuestoServicio {
  private http = inject(HttpClient);
  private urlBase = `${entorno.urlApi}/repuestos`;

  obtenerTodos(): Observable<Repuesto[]> {
    return this.http.get<Repuesto[]>(this.urlBase);
  }

  obtenerPorId(id: number): Observable<Repuesto> {
    return this.http.get<Repuesto>(`${this.urlBase}/${id}`);
  }

  // El backend responde 200 OK sin cuerpo al crear.
  crear(dto: RepuestoCrear): Observable<void> {
    return this.http.post<void>(this.urlBase, dto);
  }

  actualizar(id: number, dto: RepuestoActualizar): Observable<void> {
    return this.http.put<void>(`${this.urlBase}/${id}`, dto);
  }

  entradaStock(id: number, dto: RepuestoAjusteStock): Observable<void> {
    return this.http.patch<void>(`${this.urlBase}/${id}/entrada`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }
}
