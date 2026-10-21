import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { entorno } from '../../../environments/environment';
import { Cliente, ClienteCrear, ClienteActualizar } from '../models';

@Injectable({ providedIn: 'root' })
export class ClienteServicio {
  private http = inject(HttpClient);
  private urlBase = `${entorno.urlApi}/clientes`;

  obtenerTodos(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.urlBase);
  }

  obtenerPorId(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.urlBase}/${id}`);
  }

  // El backend responde 200 OK sin cuerpo al crear.
  crear(dto: ClienteCrear): Observable<void> {
    return this.http.post<void>(this.urlBase, dto);
  }

  actualizar(id: number, dto: ClienteActualizar): Observable<void> {
    return this.http.put<void>(`${this.urlBase}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }
}
