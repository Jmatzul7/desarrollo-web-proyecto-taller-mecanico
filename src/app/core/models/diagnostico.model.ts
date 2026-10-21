import { Usuario } from './usuario.model';

export interface Diagnostico {
  idDiagnostico: number;
  idOrden: number;
  idMecanico: number;
  mecanico?: Usuario | null;
  descripcionFalla: string;
  fechaDiagnostico: string;
  // El backend NO anida las reparaciones dentro del Diagnostico; se obtienen
  // con ReparacionServicio.obtenerTodos() filtrando por idDiagnostico.
}

export interface DiagnosticoCrear {
  idOrden: number;
  idMecanico: number;
  descripcionFalla: string;
}
