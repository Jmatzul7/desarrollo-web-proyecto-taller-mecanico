import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { entorno } from '../../../environments/environment';
import { PETICION_SILENCIOSA } from '../interceptors/silencioso';
import { CambiarPassword, PerfilActualizar, RespuestaInicioSesion, Usuario } from '../models';

@Injectable({ providedIn: 'root' })
export class PerfilServicio {
  private http = inject(HttpClient);
  private readonly url = `${entorno.urlApi}/perfil`;

  obtener(): Observable<Usuario> {
    return this.http.get<Usuario>(this.url);
  }

  /** Consulta silenciosa: se usa mientras el usuario escribe, no debe mostrar toasts. */
  nombreUsuarioDisponible(nombreUsuario: string): Observable<boolean> {
    const params = new HttpParams().set('nombreUsuario', nombreUsuario);
    return this.http
      .get<{ disponible: boolean }>(`${this.url}/nombre-usuario-disponible`, {
        params,
        context: new HttpContext().set(PETICION_SILENCIOSA, true)
      })
      .pipe(map((r) => r.disponible));
  }

  /** Devuelve una sesión nueva (token), porque el nombre de usuario viaja en el JWT. */
  actualizar(datos: PerfilActualizar): Observable<RespuestaInicioSesion> {
    return this.http.put<RespuestaInicioSesion>(this.url, datos);
  }

  /** Endpoint aparte: solo envía contraseñas, nunca el nombre de usuario. */
  cambiarPassword(datos: CambiarPassword): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(`${this.url}/password`, datos);
  }
}
