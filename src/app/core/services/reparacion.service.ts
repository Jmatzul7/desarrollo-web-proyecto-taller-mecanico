import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { entorno } from '../../../environments/environment';
import {
  Reparacion,
  ReparacionCrear,
  ReparacionAutorizar,
  ReparacionEstado,
  ReparacionRepuesto,
  ReparacionRepuestoCrear
} from '../models';

@Injectable({ providedIn: 'root' })
export class ReparacionServicio {
  private http = inject(HttpClient);
  private urlBase = `${entorno.urlApi}/reparaciones`;

  // No existe GET /reparaciones/diagnostico/{id} ni /orden/{id} en el backend:
  // se trae la lista completa y se filtra por idDiagnostico en el cliente.
  obtenerTodos(): Observable<Reparacion[]> {
    return this.http.get<Reparacion[]>(this.urlBase);
  }

  obtenerPorId(id: number): Observable<Reparacion> {
    return this.http.get<Reparacion>(`${this.urlBase}/${id}`);
  }

  // El backend responde 200 OK sin cuerpo al crear.
  crear(dto: ReparacionCrear): Observable<void> {
    return this.http.post<void>(this.urlBase, dto);
  }

  autorizar(id: number, dto: ReparacionAutorizar): Observable<void> {
    return this.http.patch<void>(`${this.urlBase}/${id}/autorizar`, dto);
  }

  cambiarEstado(id: number, dto: ReparacionEstado): Observable<void> {
    return this.http.patch<void>(`${this.urlBase}/${id}/estado`, dto);
  }

  obtenerRepuestos(idReparacion: number): Observable<ReparacionRepuesto[]> {
    return this.http.get<ReparacionRepuesto[]>(`${this.urlBase}/${idReparacion}/repuestos`);
  }

  // El backend responde 200 OK sin cuerpo al asignar un repuesto.
  agregarRepuesto(idReparacion: number, dto: ReparacionRepuestoCrear): Observable<void> {
    return this.http.post<void>(`${this.urlBase}/${idReparacion}/repuestos`, dto);
  }

  // Ruta real: DELETE /api/reparaciones/repuestos/{idReparacionRepuesto} (sin el id de la reparación).
  quitarRepuesto(idReparacionRepuesto: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/repuestos/${idReparacionRepuesto}`);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }
}
