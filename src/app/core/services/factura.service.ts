import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { entorno } from '../../../environments/environment';
import { Factura, FacturaCrear } from '../models';

@Injectable({ providedIn: 'root' })
export class FacturaServicio {
  private http = inject(HttpClient);
  private urlBase = `${entorno.urlApi}/facturas`;

  obtenerTodos(): Observable<Factura[]> {
    return this.http.get<Factura[]>(this.urlBase);
  }

  obtenerPorId(id: number): Observable<Factura> {
    return this.http.get<Factura>(`${this.urlBase}/${id}`);
  }

  generar(dto: FacturaCrear): Observable<Factura> {
    return this.http.post<Factura>(this.urlBase, dto);
  }

  obtenerUrlPdf(id: number): string {
    return `${this.urlBase}/${id}/pdf`;
  }

  descargarPdf(id: number): Observable<Blob> {
    return this.http.get(this.obtenerUrlPdf(id), { responseType: 'blob' });
  }
}
