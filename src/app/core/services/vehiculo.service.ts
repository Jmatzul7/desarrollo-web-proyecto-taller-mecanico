import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { entorno } from '../../../environments/environment';
import { Vehiculo, VehiculoCrear, VehiculoActualizar } from '../models';

@Injectable({ providedIn: 'root' })
export class VehiculoServicio {
  private http = inject(HttpClient);
  private urlBase = `${entorno.urlApi}/vehiculos`;

  obtenerTodos(): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(this.urlBase);
  }

  obtenerPorId(id: number): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.urlBase}/${id}`);
  }

  // El backend responde 200 OK sin cuerpo al crear.
  crear(dto: VehiculoCrear): Observable<void> {
    return this.http.post<void>(this.urlBase, dto);
  }

  actualizar(id: number, dto: VehiculoActualizar): Observable<void> {
    return this.http.put<void>(`${this.urlBase}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }
}
