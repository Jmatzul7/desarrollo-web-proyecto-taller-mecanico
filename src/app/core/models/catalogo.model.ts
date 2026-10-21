export interface Rol {
  idRol: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
}

export interface EstadoOrden {
  idEstadoOrden: number;
  nombre: string;
}

export interface EstadoReparacion {
  idEstadoReparacion: number;
  nombre: string;
}

/** Datos mínimos de un mecánico (GET /api/catalogos/mecanicos). */
export interface Mecanico {
  idUsuario: number;
  nombreUsuario: string;
  nombreCompleto: string;
}

export interface Permiso {
  idPermiso: number;
  nombre: string;
  descripcion?: string | null;
}

/** Ids de catálogo fijos, copiados de los datos semilla del backend (ver README). */
export const ESTADO_ORDEN = {
  RECIBIDO: 1,
  EN_DIAGNOSTICO: 2,
  EN_REPARACION: 3,
  FINALIZADA: 4,
  FACTURADA: 5,
  CANCELADA: 6
} as const;

export const ESTADO_REPARACION = {
  PENDIENTE: 1,
  AUTORIZADA: 2,
  RECHAZADA: 3,
  EN_PROCESO: 4,
  FINALIZADA: 5
} as const;

export const ROL = {
  ADMINISTRADOR: 1,
  RECEPCIONISTA: 2,
  MECANICO: 3,
  BODEGUERO: 4
} as const;
