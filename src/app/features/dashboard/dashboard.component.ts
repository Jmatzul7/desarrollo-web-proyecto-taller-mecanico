import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { AutenticacionServicio } from '../../core/services/auth.service';
import { OrdenServicio } from '../../core/services/orden.service';
import { ClienteServicio } from '../../core/services/cliente.service';
import { RepuestoServicio } from '../../core/services/repuesto.service';
import { FacturaServicio } from '../../core/services/factura.service';
import { CargadorComponente } from '../../shared/components/spinner/spinner.component';
import { InsigniaComponente, VarianteInsignia } from '../../shared/components/badge/badge.component';
import { ESTADO_ORDEN, OrdenTrabajo, PERMISOS } from '../../core/models';

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule, RouterLink, CargadorComponente, InsigniaComponente],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class PanelComponente implements OnInit {
  private servicioOrden = inject(OrdenServicio);
  private servicioCliente = inject(ClienteServicio);
  private servicioRepuesto = inject(RepuestoServicio);
  private servicioFactura = inject(FacturaServicio);
  servicioAutenticacion = inject(AutenticacionServicio);

  /** Cada tarjeta solo se consulta y se muestra si el usuario tiene el permiso de verla. */
  readonly puedeVerClientes = computed(() => this.servicioAutenticacion.puedeHacer(PERMISOS.CLIENTES_VER));
  readonly puedeVerRepuestos = computed(() => this.servicioAutenticacion.puedeHacer(PERMISOS.REPUESTOS_VER));
  readonly puedeVerFacturas = computed(() => this.servicioAutenticacion.puedeHacer(PERMISOS.FACTURAS_VER));

  readonly cargando = signal(true);
  readonly ordenes = signal<OrdenTrabajo[]>([]);
  readonly totalClientes = signal(0);
  readonly totalRepuestosBajos = signal(0);
  readonly totalFacturado = signal(0);

  readonly ordenesActivas = computed(
    () =>
      this.ordenes().filter(
        (o) => o.idEstadoOrden !== ESTADO_ORDEN.FACTURADA && o.idEstadoOrden !== ESTADO_ORDEN.CANCELADA
      ).length
  );

  readonly ordenesRecientes = computed(() =>
    [...this.ordenes()]
      .sort((a, b) => new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime())
      .slice(0, 6)
  );

  ngOnInit(): void {
    forkJoin({
      ordenes: this.servicioOrden.obtenerTodos(),
      clientes: this.puedeVerClientes() ? this.servicioCliente.obtenerTodos() : of([]),
      repuestos: this.puedeVerRepuestos() ? this.servicioRepuesto.obtenerTodos() : of([]),
      facturas: this.puedeVerFacturas() ? this.servicioFactura.obtenerTodos() : of([])
    }).subscribe({
      next: ({ ordenes, clientes, repuestos, facturas }) => {
        this.ordenes.set(ordenes);
        this.totalClientes.set(clientes.filter((c) => c.activo).length);
        this.totalRepuestosBajos.set(repuestos.filter((r) => r.activo && r.existencia <= 5).length);
        this.totalFacturado.set(facturas.reduce((sum, f) => sum + f.total, 0));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  estadoLabel(idEstadoOrden: number): string {
    const labels: Record<number, string> = {
      1: 'Recibido',
      2: 'En Diagnóstico',
      3: 'En Reparación',
      4: 'Finalizada',
      5: 'Facturada',
      6: 'Cancelada'
    };
    return labels[idEstadoOrden] ?? '—';
  }

  estadoVariant(idEstadoOrden: number): VarianteInsignia {
    const variants: Record<number, VarianteInsignia> = {
      1: 'informacion',
      2: 'advertencia',
      3: 'advertencia',
      4: 'exito',
      5: 'primario',
      6: 'peligro'
    };
    return variants[idEstadoOrden] ?? 'neutro';
  }
}
