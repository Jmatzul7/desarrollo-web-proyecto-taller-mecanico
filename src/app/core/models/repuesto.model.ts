export interface Repuesto {
  idRepuesto: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  existencia: number;
  precioUnitario: number;
  activo: boolean;
}

export interface RepuestoCrear {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  existencia: number;
  precioUnitario: number;
}

export interface RepuestoActualizar {
  nombre: string;
  descripcion?: string | null;
  precioUnitario: number;
  activo: boolean;
}

export interface RepuestoAjusteStock {
  cantidad: number;
}
