import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { entorno } from '../../../environments/environment';
import { Diagnostico, DiagnosticoCrear } from '../models';

@Injectable({ providedIn: 'root' })
export class DiagnosticoServicio {
  private http = inject(HttpClient);
  private urlBase = `${entorno.urlApi}/diagnosticos`;

  obtenerPorId(id: number): Observable<Diagnostico> {
    return this.http.get<Diagnostico>(`${this.urlBase}/${id}`);
  }

  obtenerPorOrden(idOrden: number): Observable<Diagnostico[]> {
    return this.http.get<Diagnostico[]>(`${this.urlBase}/orden/${idOrden}`);
  }

  // El backend responde 200 OK sin cuerpo al crear.
  crear(dto: DiagnosticoCrear): Observable<void> {
    return this.http.post<void>(this.urlBase, dto);
  }
}
