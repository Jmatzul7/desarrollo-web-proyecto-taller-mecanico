import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin, Observable, of } from 'rxjs';
import { AutenticacionServicio } from '../../core/services/auth.service';
import { VehiculoServicio } from '../../core/services/vehiculo.service';
import { ClienteServicio } from '../../core/services/cliente.service';
import { NotificacionServicio } from '../../shared/components/toast/toast.service';
import { ConfirmacionServicio } from '../../shared/components/confirm-dialog/confirm.service';
import { ModalComponente } from '../../shared/components/modal/modal.component';
import { BotonComponente } from '../../shared/components/button/button.component';
import { InsigniaComponente } from '../../shared/components/badge/badge.component';
import { CargadorComponente } from '../../shared/components/spinner/spinner.component';
import { TienePermisoDirectiva } from '../../core/directives/has-permission.directive';
import { Vehiculo, Cliente, PERMISOS } from '../../core/models';

@Component({
  selector: 'app-vehiculos',
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
  templateUrl: './vehiculos.component.html',
  styleUrl: './vehiculos.component.scss'
})
export class VehiculosComponente implements OnInit {
  private servicioVehiculo = inject(VehiculoServicio);
  private servicioCliente = inject(ClienteServicio);
  private servicioAutenticacion = inject(AutenticacionServicio);
  private notificacion = inject(NotificacionServicio);
  private servicioConfirmacion = inject(ConfirmacionServicio);
  private fb = inject(FormBuilder);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly vehiculos = signal<Vehiculo[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly busqueda = signal('');
  readonly modalAbierto = signal(false);
  readonly editando = signal<Vehiculo | null>(null);

  readonly filtrados = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    if (!termino) return this.vehiculos();
    return this.vehiculos().filter(
      (v) =>
        v.placa.toLowerCase().includes(termino) ||
        v.marca.toLowerCase().includes(termino) ||
        v.modelo.toLowerCase().includes(termino) ||
        (v.cliente?.nombre ?? '').toLowerCase().includes(termino)
    );
  });

  formulario = this.fb.group({
    placa: ['', [Validators.required]],
    marca: ['', [Validators.required]],
    modelo: ['', [Validators.required]],
    anio: [null as number | null],
    color: [''],
    idCliente: [null as number | null, [Validators.required]],
    activo: [true]
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    forkJoin({
      vehiculos: this.servicioVehiculo.obtenerTodos(),
      // El selector de clientes solo se llena si el usuario puede ver clientes.
      clientes: this.servicioAutenticacion.puedeHacer(PERMISOS.CLIENTES_VER) ? this.servicioCliente.obtenerTodos() : of([])
    }).subscribe({
      next: ({ vehiculos, clientes }) => {
        this.vehiculos.set(vehiculos);
        this.clientes.set(clientes.filter((c) => c.activo));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  abrirCrear(): void {
    this.editando.set(null);
    this.formulario.reset({ placa: '', marca: '', modelo: '', anio: null, color: '', idCliente: null, activo: true });
    this.modalAbierto.set(true);
  }

  abrirEditar(vehiculo: Vehiculo): void {
    this.editando.set(vehiculo);
    this.formulario.reset({
      placa: vehiculo.placa,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio ?? null,
      color: vehiculo.color ?? '',
      idCliente: vehiculo.idCliente,
      activo: vehiculo.activo
    });
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
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

    const carga = {
      placa: value.placa ?? '',
      marca: value.marca ?? '',
      modelo: value.modelo ?? '',
      anio: value.anio ?? null,
      color: value.color || null,
      idCliente: value.idCliente ?? 0
    };

    const solicitud: Observable<unknown> = editando
      ? this.servicioVehiculo.actualizar(editando.idVehiculo, { ...carga, activo: value.activo ?? true })
      : this.servicioVehiculo.crear(carga);

    solicitud.subscribe({
      next: () => {
        this.guardando.set(false);
        this.notificacion.exito(editando ? 'Vehículo actualizado.' : 'Vehículo creado.');
        this.modalAbierto.set(false);
        this.cargar();
      },
      error: () => this.guardando.set(false)
    });
  }

  async eliminar(vehiculo: Vehiculo): Promise<void> {
    const confirmed = await this.servicioConfirmacion.confirmar({
      titulo: 'Desactivar vehículo',
      texto: `¿Seguro que deseas desactivar el vehículo "${vehiculo.placa}"?`,
      textoConfirmar: 'Desactivar',
      variante: 'peligro'
    });
    if (!confirmed) return;

    this.servicioVehiculo.eliminar(vehiculo.idVehiculo).subscribe({
      next: () => {
        this.notificacion.exito('Vehículo desactivado.');
        this.cargar();
      }
    });
  }
}
