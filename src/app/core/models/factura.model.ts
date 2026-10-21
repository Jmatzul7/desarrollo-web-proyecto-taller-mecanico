import { OrdenTrabajo } from './orden.model';

// Refleja la entidad real que devuelve el backend en GET /api/facturas y
// GET /api/facturas/{id} (Services/FacturaRepositoryEF.cs incluye
// Orden -> Vehiculo -> Cliente y Orden -> Mecanico). NO es un DTO plano:
// el desglose por reparación (FacturaDetalleDTO) solo existe internamente
// para generar el PDF, nunca se expone en JSON.
export interface Factura {
  idFactura: number;
  idOrden: number;
  orden?: OrdenTrabajo | null;
  fechaEmision: string;
  costoManoObra: number;
  costoRepuestos: number;
  total: number;
  estado: string;
}

export interface FacturaCrear {
  idOrden: number;
}
