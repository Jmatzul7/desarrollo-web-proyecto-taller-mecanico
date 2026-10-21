export interface Usuario {
  idUsuario: number;
  nombreUsuario: string;
  nombreCompleto: string;
  email?: string | null;
  idRol: number;
  rol?: string | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface UsuarioCrear {
  nombreUsuario: string;
  password: string;
  nombreCompleto: string;
  email?: string | null;
  idRol: number;
}

export interface UsuarioActualizar {
  nombreCompleto: string;
  email?: string | null;
  idRol: number;
  activo: boolean;
}
