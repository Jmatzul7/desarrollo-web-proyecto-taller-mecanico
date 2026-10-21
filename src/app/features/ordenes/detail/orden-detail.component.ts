import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of, switchMap, map } from 'rxjs';
import { OrdenServicio } from '../../../core/services/orden.service';
import { DiagnosticoServicio } from '../../../core/services/diagnostico.service';
import { ReparacionServicio } from '../../../core/services/reparacion.service';
import { RepuestoServicio } from '../../../core/services/repuesto.service';
import { FacturaServicio } from '../../../core/services/factura.service';
import { CatalogoServicio } from '../../../core/services/catalogo.service';
import { AutenticacionServicio } from '../../../core/services/auth.service';
import { NotificacionServicio } from '../../../shared/components/toast/toast.service';
import { ConfirmacionServicio } from '../../../shared/components/confirm-dialog/confirm.service';
import { ModalComponente } from '../../../shared/components/modal/modal.component';
import { BotonComponente } from '../../../shared/components/button/button.component';
import { InsigniaComponente, VarianteInsignia } from '../../../shared/components/badge/badge.component';
import { CargadorComponente } from '../../../shared/components/spinner/spinner.component';
import { TienePermisoDirectiva } from '../../../core/directives/has-permission.directive';
import {
  OrdenTrabajo,
  Diagnostico,
  Reparacion,
  ReparacionRepuesto,
  Repuesto,
  Mecanico,
  PERMISOS,
  ESTADO_ORDEN,
  ESTADO_REPARACION
} from '../../../core/models';

// El backend no anida reparaciones dentro de Diagnostico ni repuestos dentro
// de Reparacion: se arman aquí, en el cliente, a partir de llamadas separadas.
interface ReparacionVista {
  reparacion: Reparacion;
  repuestos: ReparacionRepuesto[];
}

const ETIQUETAS_ESTADO_ORDEN: Record<number, string> = {
  1: 'Recibido',
  2: 'En Diagnóstico',
  3: 'En Reparación',
  4: 'Finalizada',
  5: 'Facturada',
  6: 'Cancelada'
};

const ETIQUETAS_ESTADO_REPARACION: Record<number, string> = {
  1: 'Pendiente',
  2: 'Autorizada',
  3: 'Rechazada',
  4: 'En Proceso',
  5: 'Finalizada'
};

const VARIANTES_ESTADO_REPARACION: Record<number, VarianteInsignia> = {
  1: 'neutro',
  2: 'informacion',
  3: 'peligro',
  4: 'advertencia',
  5: 'exito'
};

@Component({
  selector: 'app-orden-detalle',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    ModalComponente,
    BotonComponente,
    InsigniaComponente,
    CargadorComponente,
    TienePermisoDirectiva
  ],
  templateUrl: './orden-detail.component.html',
  styleUrl: './orden-detail.component.scss'
})
export class OrdenDetalleComponente implements OnInit {
  private ruta = inject(ActivatedRoute);
  private enrutador = inject(Router);
  private servicioOrden = inject(OrdenServicio);
  private servicioDiagnostico = inject(DiagnosticoServicio);
  private servicioReparacion = inject(ReparacionServicio);
  private servicioRepuesto = inject(RepuestoServicio);
  private servicioFactura = inject(FacturaServicio);
  private servicioCatalogo = inject(CatalogoServicio);
  private servicioAutenticacion = inject(AutenticacionServicio);
  private notificacion = inject(NotificacionServicio);
  private servicioConfirmacion = inject(ConfirmacionServicio);
  private fb = inject(FormBuilder);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly orden = signal<OrdenTrabajo | null>(null);
  readonly diagnosticos = signal<Diagnostico[]>([]);
  readonly reparacionesPorDiagnostico = signal<Map<number, ReparacionVista[]>>(new Map());
  readonly repuestos = signal<Repuesto[]>([]);
  readonly mecanicos = signal<Mecanico[]>([]);

  readonly modalDiagnosticoAbierto = signal(false);
  readonly modalReparacionAbierto = signal(false);
  readonly modalRepuestoAbierto = signal(false);
  readonly idDiagnosticoActivo = signal<number | null>(null);
  readonly idReparacionActiva = signal<number | null>(null);

  readonly estadoOrdenOpciones = Object.entries(ETIQUETAS_ESTADO_ORDEN).map(([id, nombre]) => ({
    id: Number(id),
    nombre
  }));

  formularioDiagnostico = this.fb.group({
    descripcionFalla: ['', [Validators.required]],
    idMecanico: [null as number | null, [Validators.required]]
  });

  formularioReparacion = this.fb.group({
    descripcion: ['', [Validators.required]],
    orden: [1, [Validators.required, Validators.min(1)]],
    costoManoObra: [null as number | null]
  });

  formularioRepuesto = this.fb.group({
    idRepuesto: [null as number | null, [Validators.required]],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    justificacion: ['', [Validators.required]]
  });

  private get idOrden(): number {
    return Number(this.ruta.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    forkJoin({
      orden: this.servicioOrden.obtenerPorId(this.idOrden),
      diagnosticos: this.servicioDiagnostico.obtenerPorOrden(this.idOrden),
      // No existe un endpoint que filtre reparaciones por orden/diagnóstico:
      // se trae la lista completa y se filtra en el cliente.
      todasReparaciones: this.servicioReparacion.obtenerTodos(),
      // Repuestos y mecánicos solo se piden si el usuario tiene permiso para verlos.
      repuestos: this.servicioAutenticacion.puedeHacer(PERMISOS.REPUESTOS_VER) ? this.servicioRepuesto.obtenerTodos() : of([]),
      mecanicos: this.servicioAutenticacion.puedeHacer(PERMISOS.MECANICOS_VER) ? this.servicioCatalogo.obtenerMecanicos() : of([])
    })
      .pipe(
        switchMap(({ orden, diagnosticos, todasReparaciones, repuestos, mecanicos }) => {
          const idsDiagnostico = new Set(diagnosticos.map((d) => d.idDiagnostico));
          const reparacionesDeOrden = todasReparaciones.filter((r) => idsDiagnostico.has(r.idDiagnostico));

          if (reparacionesDeOrden.length === 0) {
            return of({ orden, diagnosticos, repuestos, mecanicos, mapa: new Map<number, ReparacionVista[]>() });
          }

          return forkJoin(
            reparacionesDeOrden.map((reparacion) =>
              this.servicioReparacion
                .obtenerRepuestos(reparacion.idReparacion)
                .pipe(map((repuestosUsados) => ({ reparacion, repuestos: repuestosUsados })))
            )
          ).pipe(
            map((items) => {
              const mapa = new Map<number, ReparacionVista[]>();
              for (const item of items) {
                const lista = mapa.get(item.reparacion.idDiagnostico) ?? [];
                lista.push(item);
                mapa.set(item.reparacion.idDiagnostico, lista);
              }
              return { orden, diagnosticos, repuestos, mecanicos, mapa };
            })
          );
        })
      )
      .subscribe({
        next: ({ orden, diagnosticos, repuestos, mecanicos, mapa }) => {
          this.orden.set(orden);
          this.diagnosticos.set(diagnosticos);
          this.reparacionesPorDiagnostico.set(mapa);
          this.repuestos.set(repuestos.filter((r) => r.activo));
          this.mecanicos.set(mecanicos);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false)
      });
  }

  reparacionesDe(diagnostico: Diagnostico): ReparacionVista[] {
    return this.reparacionesPorDiagnostico().get(diagnostico.idDiagnostico) ?? [];
  }

  // ---------- Orden ----------

  cambiarEstadoOrden(idEstadoOrden: number): void {
    this.servicioOrden.cambiarEstado(this.idOrden, { idEstadoOrden }).subscribe({
      next: () => {
        this.notificacion.exito('Estado de la orden actualizado.');
        this.cargar();
      }
    });
  }

  async generarFactura(): Promise<void> {
    const confirmed = await this.servicioConfirmacion.confirmar({
      titulo: 'Generar factura',
      texto: 'Se generará la factura con el total de mano de obra y repuestos de esta orden. ¿Deseas continuar?'
    });
    if (!confirmed) return;

    this.servicioFactura.generar({ idOrden: this.idOrden }).subscribe({
      next: (factura) => {
        this.notificacion.exito('Factura generada correctamente.');
        // Solo se abre el detalle si el usuario tiene permiso para ver facturas.
        if (this.servicioAutenticacion.puedeHacer(PERMISOS.FACTURAS_VER)) {
          this.enrutador.navigate(['/facturas', factura.idFactura]);
        } else {
          this.cargar();
        }
      }
    });
  }

  // ---------- Diagnósticos ----------

  abrirModalDiagnostico(): void {
    this.formularioDiagnostico.reset({
      descripcionFalla: '',
      idMecanico: this.orden()?.idMecanico ?? null
    });
    this.modalDiagnosticoAbierto.set(true);
  }

  guardarDiagnostico(): void {
    if (this.formularioDiagnostico.invalid) {
      this.formularioDiagnostico.markAllAsTouched();
      return;
    }

    const value = this.formularioDiagnostico.getRawValue();
    this.guardando.set(true);

    this.servicioDiagnostico
      .crear({
        idOrden: this.idOrden,
        idMecanico: value.idMecanico ?? 0,
        descripcionFalla: value.descripcionFalla ?? ''
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.notificacion.exito('Diagnóstico registrado.');
          this.modalDiagnosticoAbierto.set(false);
          this.cargar();
        },
        error: () => this.guardando.set(false)
      });
  }

  // ---------- Reparaciones ----------

  abrirModalReparacion(diagnostico: Diagnostico): void {
    this.idDiagnosticoActivo.set(diagnostico.idDiagnostico);
    const siguienteOrden = this.reparacionesDe(diagnostico).length + 1;
    this.formularioReparacion.reset({ descripcion: '', orden: siguienteOrden, costoManoObra: null });
    this.modalReparacionAbierto.set(true);
  }

  guardarReparacion(): void {
    if (this.formularioReparacion.invalid) {
      this.formularioReparacion.markAllAsTouched();
      return;
    }

    const idDiagnostico = this.idDiagnosticoActivo();
    if (!idDiagnostico) return;

    const value = this.formularioReparacion.getRawValue();
    this.guardando.set(true);

    this.servicioReparacion
      .crear({
        idDiagnostico,
        descripcion: value.descripcion ?? '',
        orden: value.orden ?? 1,
        costoManoObra: value.costoManoObra ?? null
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.notificacion.exito('Reparación registrada.');
          this.modalReparacionAbierto.set(false);
          this.cargar();
        },
        error: () => this.guardando.set(false)
      });
  }

  async autorizar(reparacion: Reparacion, aprobar: boolean): Promise<void> {
    const confirmed = await this.servicioConfirmacion.confirmar({
      titulo: aprobar ? 'Autorizar reparación' : 'Rechazar reparación',
      texto: aprobar
        ? `¿Autorizas la reparación "${reparacion.descripcion}"?`
        : `¿Seguro que deseas rechazar la reparación "${reparacion.descripcion}"?`,
      variante: aprobar ? 'primario' : 'peligro',
      textoConfirmar: aprobar ? 'Autorizar' : 'Rechazar'
    });
    if (!confirmed) return;

    this.servicioReparacion.autorizar(reparacion.idReparacion, { aprobar }).subscribe({
      next: () => {
        this.notificacion.exito(aprobar ? 'Reparación autorizada.' : 'Reparación rechazada.');
        this.cargar();
      }
    });
  }

  cambiarEstadoReparacion(reparacion: Reparacion, idEstadoReparacion: number): void {
    this.servicioReparacion.cambiarEstado(reparacion.idReparacion, { idEstadoReparacion }).subscribe({
      next: () => {
        this.notificacion.exito('Estado de la reparación actualizado.');
        this.cargar();
      }
    });
  }

  // ---------- Repuestos en reparación ----------

  abrirModalRepuesto(reparacion: Reparacion): void {
    this.idReparacionActiva.set(reparacion.idReparacion);
    this.formularioRepuesto.reset({ idRepuesto: null, cantidad: 1, justificacion: '' });
    this.modalRepuestoAbierto.set(true);
  }

  guardarRepuesto(): void {
    if (this.formularioRepuesto.invalid) {
      this.formularioRepuesto.markAllAsTouched();
      return;
    }

    const idReparacion = this.idReparacionActiva();
    if (!idReparacion) return;

    const value = this.formularioRepuesto.getRawValue();
    this.guardando.set(true);

    this.servicioReparacion
      .agregarRepuesto(idReparacion, {
        idRepuesto: value.idRepuesto ?? 0,
        cantidad: value.cantidad ?? 1,
        justificacion: value.justificacion ?? ''
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.notificacion.exito('Repuesto asignado a la reparación.');
          this.modalRepuestoAbierto.set(false);
          this.cargar();
        },
        error: () => this.guardando.set(false)
      });
  }

  async quitarRepuesto(reparacion: Reparacion, idReparacionRepuesto: number): Promise<void> {
    const confirmed = await this.servicioConfirmacion.confirmar({
      titulo: 'Quitar repuesto',
      texto: '¿Deseas quitar este repuesto de la reparación? El stock será devuelto.',
      variante: 'peligro',
      textoConfirmar: 'Quitar'
    });
    if (!confirmed) return;

    this.servicioReparacion.quitarRepuesto(idReparacionRepuesto).subscribe({
      next: () => {
        this.notificacion.exito('Repuesto removido.');
        this.cargar();
      }
    });
  }

  // ---------- Etiquetas ----------

  estadoOrdenLabel(id: number): string {
    return ETIQUETAS_ESTADO_ORDEN[id] ?? '—';
  }

  estadoReparacionLabel(id: number): string {
    return ETIQUETAS_ESTADO_REPARACION[id] ?? '—';
  }

  estadoReparacionVariant(id: number): VarianteInsignia {
    return VARIANTES_ESTADO_REPARACION[id] ?? 'neutro';
  }

  get ESTADO_ORDEN() {
    return ESTADO_ORDEN;
  }

  get ESTADO_REPARACION() {
    return ESTADO_REPARACION;
  }

  esOrdenFacturada(): boolean {
  const idEstado = this.orden()?.idEstadoOrden;
  if (!idEstado) return false;
  return ETIQUETAS_ESTADO_ORDEN[idEstado] === 'Facturada';
}
}


