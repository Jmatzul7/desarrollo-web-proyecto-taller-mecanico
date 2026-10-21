import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { entorno } from '../../../environments/environment';
import { Usuario, UsuarioCrear, UsuarioActualizar } from '../models';

@Injectable({ providedIn: 'root' })
export class UsuarioServicio {
  private http = inject(HttpClient);
  private urlBase = `${entorno.urlApi}/usuarios`;

  obtenerTodos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.urlBase);
  }

  obtenerPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.urlBase}/${id}`);
  }

  // El backend responde 200 OK sin cuerpo al crear.
  crear(dto: UsuarioCrear): Observable<void> {
    return this.http.post<void>(this.urlBase, dto);
  }

  actualizar(id: number, dto: UsuarioActualizar): Observable<void> {
    return this.http.put<void>(`${this.urlBase}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }
}
