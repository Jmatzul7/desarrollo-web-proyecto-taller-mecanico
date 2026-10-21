import { Vehiculo } from './vehiculo.model';
import { Usuario } from './usuario.model';
import { EstadoOrden } from './catalogo.model';
import { Diagnostico } from './diagnostico.model';

export interface OrdenTrabajo {
  idOrden: number;
  idVehiculo: number;
  vehiculo?: Vehiculo | null;
  idMecanico: number;
  mecanico?: Usuario | null;
  fechaIngreso: string;
  fechaSalida?: string | null;
  idEstadoOrden: number;
  estadoOrden?: EstadoOrden | null;
  observaciones?: string | null;
  diagnosticos?: Diagnostico[];
}

export interface OrdenTrabajoCrear {
  idVehiculo: number;
  idMecanico: number;
  observaciones?: string | null;
}

export interface OrdenTrabajoEstado {
  idEstadoOrden: number;
}
