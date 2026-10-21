import { Cliente } from './cliente.model';

export interface Vehiculo {
  idVehiculo: number;
  placa: string;
  marca: string;
  modelo: string;
  anio?: number | null;
  color?: string | null;
  idCliente: number;
  cliente?: Cliente | null;
  activo: boolean;
}

export interface VehiculoCrear {
  placa: string;
  marca: string;
  modelo: string;
  anio?: number | null;
  color?: string | null;
  idCliente: number;
}

export interface VehiculoActualizar extends VehiculoCrear {
  activo: boolean;
}
