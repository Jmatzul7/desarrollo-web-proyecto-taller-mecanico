import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { PETICION_SILENCIOSA } from '../interceptors/silencioso';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { entorno } from '../../../environments/environment';
import { SolicitudInicioSesion, RespuestaInicioSesion, SolicitudRegistro, SesionUsuario } from '../models';

const CLAVE_ALMACENAMIENTO = 'taller_token';

function decodificarJwt(token: string): Record<string, unknown> {
  try {
    const carga = token.split('.')[1];
    const normalizado = carga.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalizado)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}

@Injectable({ providedIn: 'root' })
export class AutenticacionServicio {
  private http = inject(HttpClient);
  private enrutador = inject(Router);

  private readonly CLAIM_ROL = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
  private readonly CLAIM_NOMBRE = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
  private readonly CLAIM_ID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

  readonly sesion = signal<SesionUsuario | null>(this.restaurarSesion());
  readonly estaAutenticado = computed(() => !!this.sesion());

  iniciarSesion(solicitud: SolicitudInicioSesion): Observable<RespuestaInicioSesion> {
    return this.http.post<RespuestaInicioSesion>(`${entorno.urlApi}/auth/login`, solicitud).pipe(
      tap((respuesta) => this.establecerSesion(respuesta.token))
    );
  }

  /**
   * Pide al backend un token nuevo con el rol y los permisos vigentes y actualiza
   * la sesión. Así los cambios de permisos se reflejan sin cerrar sesión.
   */
  refrescarSesion(): Observable<RespuestaInicioSesion> {
    return this.http
      .post<RespuestaInicioSesion>(`${entorno.urlApi}/auth/refrescar`, {}, { context: new HttpContext().set(PETICION_SILENCIOSA, true) })
      .pipe(tap((respuesta) => this.establecerSesion(respuesta.token)));
  }

  registro(solicitud: SolicitudRegistro): Observable<void> {
    return this.http.post<void>(`${entorno.urlApi}/auth/registro`, solicitud);
  }

  cerrarSesion(): void {
    localStorage.removeItem(CLAVE_ALMACENAMIENTO);
    this.sesion.set(null);
    this.enrutador.navigate(['/iniciar-sesion']);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_ALMACENAMIENTO);
  }

  /** Atajo para las definiciones de `PERMISOS`: rol por defecto O permiso granular. */
  puedeHacer(definicion: { permiso: string; roles: readonly string[] }): boolean {
    return this.puede(definicion.permiso, ...definicion.roles);
  }

  tieneRol(...roles: string[]): boolean {
    const rol = this.sesion()?.rol;
    return !!rol && roles.some((r) => r.toLowerCase() === rol.toLowerCase());
  }

  poseePermiso(permiso: string): boolean {
    return !!this.sesion()?.permisos.includes(permiso);
  }

  /** Verdadero si el rol del usuario lo permite O si tiene el permiso granular específico. */
  puede(permiso: string, ...rolesPermitidos: string[]): boolean {
    return this.tieneRol(...rolesPermitidos) || this.poseePermiso(permiso);
  }

  /** Aplica un token nuevo recibido fuera del login (p. ej. tras editar el perfil). */
  aplicarToken(token: string): void {
    this.establecerSesion(token);
  }

  private establecerSesion(token: string): void {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, token);
    this.sesion.set(this.interpretarToken(token));
  }

  private restaurarSesion(): SesionUsuario | null {
    const token = this.obtenerToken();
    if (!token) return null;
    const interpretada = this.interpretarToken(token);
    if (!interpretada) return null;
    // Protege contra un token vencido que quedó guardado de una visita anterior.
    const carga = decodificarJwt(token);
    const exp = carga['exp'] as number | undefined;
    if (exp && Date.now() >= exp * 1000) {
      localStorage.removeItem(CLAVE_ALMACENAMIENTO);
      return null;
    }
    return interpretada;
  }

  private interpretarToken(token: string): SesionUsuario | null {
    const carga = decodificarJwt(token);
    const idUsuarioRaw = carga[this.CLAIM_ID] ?? carga['nameid'];
    const nombreUsuario = (carga[this.CLAIM_NOMBRE] ?? carga['unique_name']) as string | undefined;
    const rol = (carga[this.CLAIM_ROL] ?? carga['role']) as string | undefined;
    const nombreCompleto = carga['nombreCompleto'] as string | undefined;
    const permisoRaw = carga['permiso'];

    if (!idUsuarioRaw || !nombreUsuario || !rol) return null;

    const permisos = Array.isArray(permisoRaw)
      ? (permisoRaw as string[])
      : typeof permisoRaw === 'string'
        ? [permisoRaw]
        : [];

    return {
      idUsuario: Number(idUsuarioRaw),
      nombreUsuario,
      nombreCompleto: nombreCompleto ?? nombreUsuario,
      rol,
      permisos
    };
  }
}
