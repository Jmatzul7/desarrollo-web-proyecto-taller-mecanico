import { EstadoReparacion } from './catalogo.model';
import { Usuario } from './usuario.model';
import { Repuesto } from './repuesto.model';

export interface Reparacion {
  idReparacion: number;
  idDiagnostico: number;
  descripcion: string;
  idEstadoReparacion: number;
  estadoReparacion?: EstadoReparacion | null;
  idAutorizadoPor?: number | null;
  autorizadoPor?: Usuario | null;
  fechaAutorizacion?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  orden: number;
  idReparacionPrevia?: number | null;
  costoManoObra?: number | null;
  // El backend NO anida los repuestos usados dentro de la Reparacion; se piden
  // aparte con ReparacionServicio.obtenerRepuestos(idReparacion).
}

export interface ReparacionCrear {
  idDiagnostico: number;
  descripcion: string;
  orden: number;
  idReparacionPrevia?: number | null;
  costoManoObra?: number | null;
}

export interface ReparacionAutorizar {
  aprobar: boolean;
}

export interface ReparacionEstado {
  idEstadoReparacion: number;
}

export interface ReparacionRepuesto {
  idReparacionRepuesto: number;
  idReparacion: number;
  idRepuesto: number;
  repuesto?: Repuesto | null;
  cantidad: number;
  precioUnitario: number;
  justificacion: string;
  idAutorizadoPor: number;
  autorizadoPor?: Usuario | null;
  fechaUso: string;
}

export interface ReparacionRepuestoCrear {
  idRepuesto: number;
  cantidad: number;
  justificacion: string;
}
