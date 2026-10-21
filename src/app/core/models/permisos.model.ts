/**
 * Permisos de visibilidad/consulta y los roles que los tienen por defecto.
 * Deben coincidir con los `[RequierePermiso("...", Roles = "...")]` del backend:
 * un usuario puede entrar si tiene alguno de los roles O el permiso granular.
 */
export interface DefinicionPermiso {
  permiso: string;
  roles: string[];
}

export const PERMISOS = {
  CLIENTES_VER: { permiso: 'clientes.ver', roles: ['Administrador', 'Recepcionista'] },
  VEHICULOS_VER: { permiso: 'vehiculos.ver', roles: ['Administrador', 'Recepcionista'] },
  REPUESTOS_VER: { permiso: 'repuestos.ver', roles: ['Administrador', 'Bodeguero', 'Mecanico'] },
  FACTURAS_VER: { permiso: 'facturas.ver', roles: ['Administrador', 'Recepcionista'] },
  FACTURAS_DESCARGAR_PDF: { permiso: 'facturas.descargar_pdf', roles: ['Administrador', 'Recepcionista'] },
  MECANICOS_VER: { permiso: 'usuarios.ver_mecanicos', roles: ['Administrador', 'Recepcionista', 'Mecanico'] }
} as const satisfies Record<string, DefinicionPermiso>;
