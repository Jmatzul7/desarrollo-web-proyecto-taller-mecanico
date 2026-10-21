export interface Cliente {
  idCliente: number;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo: boolean;
}

export interface ClienteCrear {
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
}

export interface ClienteActualizar extends ClienteCrear {
  activo: boolean;
}
