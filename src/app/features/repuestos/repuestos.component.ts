import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { RepuestoServicio } from '../../core/services/repuesto.service';
import { NotificacionServicio } from '../../shared/components/toast/toast.service';
import { ConfirmacionServicio } from '../../shared/components/confirm-dialog/confirm.service';
import { ModalComponente } from '../../shared/components/modal/modal.component';
import { BotonComponente } from '../../shared/components/button/button.component';
import { InsigniaComponente } from '../../shared/components/badge/badge.component';
import { CargadorComponente } from '../../shared/components/spinner/spinner.component';
import { TienePermisoDirectiva } from '../../core/directives/has-permission.directive';
import { Repuesto } from '../../core/models';

@Component({
  selector: 'app-repuestos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponente,
    BotonComponente,
    InsigniaComponente,
    CargadorComponente,
    TienePermisoDirectiva
  ],
  templateUrl: './repuestos.component.html',
  styleUrl: './repuestos.component.scss'
})
export class RepuestosComponente implements OnInit {
  private servicioRepuesto = inject(RepuestoServicio);
  private notificacion = inject(NotificacionServicio);
  private servicioConfirmacion = inject(ConfirmacionServicio);
  private fb = inject(FormBuilder);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly repuestos = signal<Repuesto[]>([]);
  readonly busqueda = signal('');
  readonly modalAbierto = signal(false);
  readonly modalStockAbierto = signal(false);
  readonly editando = signal<Repuesto | null>(null);
  readonly repuestoStock = signal<Repuesto | null>(null);

  readonly filtrados = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    if (!termino) return this.repuestos();
    return this.repuestos().filter(
      (r) => r.nombre.toLowerCase().includes(termino) || r.codigo.toLowerCase().includes(termino)
    );
  });

  formulario = this.fb.group({
    codigo: ['', [Validators.required]],
    nombre: ['', [Validators.required]],
    descripcion: [''],
    existencia: [0, [Validators.required, Validators.min(0)]],
    precioUnitario: [0, [Validators.required, Validators.min(0.01)]],
    activo: [true]
  });

  formularioStock = this.fb.group({
    cantidad: [1, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.servicioRepuesto.obtenerTodos().subscribe({
      next: (datos) => {
        this.repuestos.set(datos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  abrirCrear(): void {
    this.editando.set(null);
    this.formulario.reset({ codigo: '', nombre: '', descripcion: '', existencia: 0, precioUnitario: 0, activo: true });
    this.modalAbierto.set(true);
  }

  abrirEditar(repuesto: Repuesto): void {
    this.editando.set(repuesto);
    this.formulario.reset({
      codigo: repuesto.codigo,
      nombre: repuesto.nombre,
      descripcion: repuesto.descripcion ?? '',
      existencia: repuesto.existencia,
      precioUnitario: repuesto.precioUnitario,
      activo: repuesto.activo
    });
    this.formulario.controls.codigo.disable();
    this.formulario.controls.existencia.disable();
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.formulario.controls.codigo.enable();
    this.formulario.controls.existencia.enable();
    this.modalAbierto.set(false);
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const value = this.formulario.getRawValue();
    this.guardando.set(true);
    const editando = this.editando();

    const solicitud: Observable<unknown> = editando
      ? this.servicioRepuesto.actualizar(editando.idRepuesto, {
          nombre: value.nombre ?? '',
          descripcion: value.descripcion || null,
          precioUnitario: value.precioUnitario ?? 0,
          activo: value.activo ?? true
        })
      : this.servicioRepuesto.crear({
          codigo: value.codigo ?? '',
          nombre: value.nombre ?? '',
          descripcion: value.descripcion || null,
          existencia: value.existencia ?? 0,
          precioUnitario: value.precioUnitario ?? 0
        });

    solicitud.subscribe({
      next: () => {
        this.guardando.set(false);
        this.notificacion.exito(editando ? 'Repuesto actualizado.' : 'Repuesto creado.');
        this.cerrarModal();
        this.cargar();
      },
      error: () => this.guardando.set(false)
    });
  }

  abrirModalStock(repuesto: Repuesto): void {
    this.repuestoStock.set(repuesto);
    this.formularioStock.reset({ cantidad: 1 });
    this.modalStockAbierto.set(true);
  }

  cerrarModalStock(): void {
    this.modalStockAbierto.set(false);
  }

  guardarStock(): void {
    const target = this.repuestoStock();
    if (!target || this.formularioStock.invalid) {
      this.formularioStock.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.servicioRepuesto.entradaStock(target.idRepuesto, { cantidad: this.formularioStock.getRawValue().cantidad ?? 1 }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.notificacion.exito('Entrada de stock registrada.');
        this.modalStockAbierto.set(false);
        this.cargar();
      },
      error: () => this.guardando.set(false)
    });
  }

  async eliminar(repuesto: Repuesto): Promise<void> {
    const confirmed = await this.servicioConfirmacion.confirmar({
      titulo: 'Desactivar repuesto',
      texto: `¿Seguro que deseas desactivar "${repuesto.nombre}"?`,
      textoConfirmar: 'Desactivar',
      variante: 'peligro'
    });
    if (!confirmed) return;

    this.servicioRepuesto.eliminar(repuesto.idRepuesto).subscribe({
      next: () => {
        this.notificacion.exito('Repuesto desactivado.');
        this.cargar();
      }
    });
  }
}
