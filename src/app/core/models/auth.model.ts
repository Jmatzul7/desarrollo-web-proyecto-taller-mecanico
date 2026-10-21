export interface SolicitudInicioSesion {
  nombreUsuario: string;
  password: string;
}

export interface RespuestaInicioSesion {
  token: string;
  expira: string;
  idUsuario: number;
  nombreUsuario: string;
  nombreCompleto: string;
  rol: string;
}

export interface SolicitudRegistro {
  nombreUsuario: string;
  password: string;
  nombreCompleto: string;
  email?: string | null;
  idRol: number;
}

/** Estructura del payload del JWT decodificado que usa AutenticacionServicio. */
export interface CargaJwt {
  nameid?: string;
  unique_name?: string;
  role?: string;
  nombreCompleto?: string;
  permiso?: string | string[];
  exp?: number;
  [key: string]: unknown;
}

export interface SesionUsuario {
  idUsuario: number;
  nombreUsuario: string;
  nombreCompleto: string;
  rol: string;
  permisos: string[];
}
