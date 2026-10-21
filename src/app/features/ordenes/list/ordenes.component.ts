import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, forkJoin, map, of, switchMap, tap, throwError } from 'rxjs';
import { OrdenServicio } from '../../../core/services/orden.service';
import { ClienteServicio } from '../../../core/services/cliente.service';
import { VehiculoServicio } from '../../../core/services/vehiculo.service';
import { AutenticacionServicio } from '../../../core/services/auth.service';
import { CatalogoServicio } from '../../../core/services/catalogo.service';
import { NotificacionServicio } from '../../../shared/components/toast/toast.service';
import { ModalComponente } from '../../../shared/components/modal/modal.component';
import { BotonComponente } from '../../../shared/components/button/button.component';
import { InsigniaComponente, VarianteInsignia } from '../../../shared/components/badge/badge.component';
import { CargadorComponente } from '../../../shared/components/spinner/spinner.component';
import { TienePermisoDirectiva } from '../../../core/directives/has-permission.directive';
import { OrdenTrabajo, Vehiculo, Cliente, Mecanico, PERMISOS } from '../../../core/models';

const ETIQUETAS_ESTADO: Record<number, string> = {
  1: 'Recibido',
  2: 'En Diagnóstico',
  3: 'En Reparación',
  4: 'Finalizada',
  5: 'Facturada',
  6: 'Cancelada'
};

const VARIANTES_ESTADO: Record<number, VarianteInsignia> = {
  1: 'informacion',
  2: 'advertencia',
  3: 'advertencia',
  4: 'exito',
  5: 'primario',
  6: 'peligro'
};

@Component({
  selector: 'app-ordenes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ModalComponente,
    BotonComponente,
    InsigniaComponente,
    CargadorComponente,
    TienePermisoDirectiva
  ],
  templateUrl: './ordenes.component.html',
  styleUrl: './ordenes.component.scss'
})
export class OrdenesComponente implements OnInit {
  private servicioOrden = inject(OrdenServicio);
  private servicioCliente = inject(ClienteServicio);
  private servicioVehiculo = inject(VehiculoServicio);
  private servicioAutenticacion = inject(AutenticacionServicio);
  private servicioCatalogo = inject(CatalogoServicio);
  private notificacion = inject(NotificacionServicio);
  private fb = inject(FormBuilder);
  private enrutador = inject(Router);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly ordenes = signal<OrdenTrabajo[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly vehiculos = signal<Vehiculo[]>([]);
  readonly mecanicos = signal<Mecanico[]>([]);
  readonly estadoFiltro = signal<number | null>(null);
  readonly modalAbierto = signal(false);

  readonly estadoOpciones = Object.entries(ETIQUETAS_ESTADO).map(([id, nombre]) => ({ id: Number(id), nombre }));

  readonly filtrados = computed(() => {
    const estado = this.estadoFiltro();
    if (!estado) return this.ordenes();
    return this.ordenes().filter((o) => o.idEstadoOrden === estado);
  });

  /** Si se elige un cliente/vehículo existente o se registra uno nuevo desde el mismo modal. */
  readonly modoCliente = signal<'existente' | 'nuevo'>('existente');
  readonly modoVehiculo = signal<'existente' | 'nuevo'>('existente');
  readonly idClienteSeleccionado = signal<number | null>(null);

  /** Solo se pueden registrar clientes/vehículos nuevos con el permiso correspondiente. */
  readonly puedeCrearCliente = computed(() => this.servicioAutenticacion.puede('clientes.crear', 'Administrador', 'Recepcionista'));
  readonly puedeCrearVehiculo = computed(() => this.servicioAutenticacion.puede('vehiculos.crear', 'Administrador', 'Recepcionista'));

  /** Vehículos del cliente elegido (la lista se filtra al cambiar de cliente). */
  readonly vehiculosDelCliente = computed(() => {
    const idCliente = this.idClienteSeleccionado();
    return idCliente === null ? [] : this.vehiculos().filter((v) => v.idCliente === idCliente);
  });

  formulario = this.fb.group({
    idCliente: [null as number | null],
    idVehiculo: [null as number | null],
    idMecanico: [null as number | null, [Validators.required]],
    observaciones: ['']
  });

  formularioCliente = this.fb.group({
    nombre: ['', [Validators.required]],
    telefono: [''],
    email: ['', [Validators.email]],
    direccion: ['']
  });

  formularioVehiculo = this.fb.group({
    placa: ['', [Validators.required]],
    marca: ['', [Validators.required]],
    modelo: ['', [Validators.required]],
    anio: [null as number | null],
    color: ['']
  });

  constructor() {
    this.formulario.controls.idCliente.valueChanges.subscribe((idCliente) => {
      this.idClienteSeleccionado.set(idCliente);
      this.formulario.controls.idVehiculo.reset(null);
      // Si el cliente no tiene vehículos, se pasa directo a registrar uno nuevo.
      if (idCliente !== null && this.puedeCrearVehiculo() && this.vehiculosDelCliente().length === 0) {
        this.modoVehiculo.set('nuevo');
      } else {
        this.modoVehiculo.set('existente');
      }
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    forkJoin({
      ordenes: this.servicioOrden.obtenerTodos(),
      // Cada lista auxiliar se pide solo si el usuario tiene permiso para verla.
      clientes: this.servicioAutenticacion.puedeHacer(PERMISOS.CLIENTES_VER) ? this.servicioCliente.obtenerTodos() : of([]),
      vehiculos: this.servicioAutenticacion.puedeHacer(PERMISOS.VEHICULOS_VER) ? this.servicioVehiculo.obtenerTodos() : of([]),
      mecanicos: this.servicioAutenticacion.puedeHacer(PERMISOS.MECANICOS_VER) ? this.servicioCatalogo.obtenerMecanicos() : of([])
    }).subscribe({
      next: ({ ordenes, clientes, vehiculos, mecanicos }) => {
        this.ordenes.set(ordenes);
        this.clientes.set(clientes.filter((c) => c.activo));
        this.vehiculos.set(vehiculos.filter((v) => v.activo));
        this.mecanicos.set(mecanicos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  abrirCrear(): void {
    this.formulario.reset({ idCliente: null, idVehiculo: null, idMecanico: null, observaciones: '' });
    this.formularioCliente.reset({ nombre: '', telefono: '', email: '', direccion: '' });
    this.formularioVehiculo.reset({ placa: '', marca: '', modelo: '', anio: null, color: '' });
    this.idClienteSeleccionado.set(null);
    this.modoCliente.set('existente');
    this.modoVehiculo.set('existente');
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  /** Cambia entre elegir un cliente existente y registrar uno nuevo. */
  cambiarModoCliente(modo: 'existente' | 'nuevo'): void {
    this.modoCliente.set(modo);
    if (modo === 'nuevo') {
      // Un cliente nuevo todavía no tiene vehículos: el vehículo también es nuevo.
      this.formulario.controls.idCliente.reset(null, { emitEvent: false });
      this.idClienteSeleccionado.set(null);
      this.formulario.controls.idVehiculo.reset(null);
      this.modoVehiculo.set('nuevo');
    } else {
      this.modoVehiculo.set('existente');
    }
  }

  cambiarModoVehiculo(modo: 'existente' | 'nuevo'): void {
    this.modoVehiculo.set(modo);
  }

  guardar(): void {
    const clienteNuevo = this.modoCliente() === 'nuevo';
    const vehiculoNuevo = this.modoVehiculo() === 'nuevo';
    const { idCliente, idVehiculo } = this.formulario.getRawValue();

    // Validación según lo que el usuario esté llenando en este momento.
    const grupos: AbstractControl[] = [this.formulario];
    if (clienteNuevo) grupos.push(this.formularioCliente);
    if (vehiculoNuevo) grupos.push(this.formularioVehiculo);
    grupos.forEach((g) => g.markAllAsTouched());

    const faltaSeleccion =
      (!clienteNuevo && idCliente === null) || (!vehiculoNuevo && idVehiculo === null);
    if (faltaSeleccion || grupos.some((g) => g.invalid)) {
      return;
    }

    this.guardando.set(true);

    this.resolverCliente()
      .pipe(
        switchMap((idClienteFinal) => this.resolverVehiculo(idClienteFinal)),
        switchMap((idVehiculoFinal) =>
          this.servicioOrden.crear({
            idVehiculo: idVehiculoFinal,
            idMecanico: this.formulario.getRawValue().idMecanico ?? 0,
            observaciones: this.formulario.getRawValue().observaciones || null
          })
        )
      )
      .subscribe({
        next: () => {
          this.notificacion.exito('Orden de trabajo creada.');
          this.modalAbierto.set(false);
          // El backend no devuelve la orden creada (200 OK sin cuerpo), así que
          // recargamos la lista y saltamos al detalle de la más reciente.
          this.servicioOrden.obtenerTodos().subscribe({
            next: (ordenes) => {
              this.guardando.set(false);
              const masReciente = ordenes.reduce((max, o) => (o.idOrden > max.idOrden ? o : max), ordenes[0]);
              if (masReciente) {
                this.enrutador.navigate(['/ordenes', masReciente.idOrden]);
              } else {
                this.cargar();
              }
            },
            error: () => {
              this.guardando.set(false);
              this.cargar();
            }
          });
        },
        error: () => this.guardando.set(false)
      });
  }

  /**
   * Devuelve el id del cliente. Si es nuevo lo crea; como el backend responde
   * 200 sin cuerpo, se vuelve a consultar la lista y se toma el de mayor id con
   * ese nombre. Luego pasa a modo "existente" para que, si un paso posterior
   * falla, un reintento no duplique el cliente.
   */
  private resolverCliente(): Observable<number> {
    if (this.modoCliente() === 'existente') {
      return of(this.formulario.getRawValue().idCliente as number);
    }

    const v = this.formularioCliente.getRawValue();
    const dto = {
      nombre: (v.nombre ?? '').trim(),
      telefono: v.telefono || null,
      email: v.email || null,
      direccion: v.direccion || null
    };

    return this.servicioCliente.crear(dto).pipe(
      switchMap(() => this.servicioCliente.obtenerTodos()),
      map((lista) =>
        lista
          .filter((c) => c.nombre === dto.nombre)
          .reduce<Cliente | null>((max, c) => (!max || c.idCliente > max.idCliente ? c : max), null)
      ),
      switchMap((cliente) =>
        cliente ? of(cliente) : throwError(() => new Error('No se pudo ubicar el cliente recién creado.'))
      ),
      tap((cliente) => {
        this.clientes.update((lista) => [...lista.filter((c) => c.idCliente !== cliente.idCliente), cliente]);
        this.modoCliente.set('existente');
        this.formulario.controls.idCliente.setValue(cliente.idCliente, { emitEvent: false });
        this.idClienteSeleccionado.set(cliente.idCliente);
        this.modoVehiculo.set('nuevo');
        this.notificacion.exito(`Cliente "${cliente.nombre}" registrado.`);
      }),
      map((cliente) => cliente.idCliente)
    );
  }

  /** Igual que resolverCliente, pero para el vehículo (se ubica por placa y cliente). */
  private resolverVehiculo(idCliente: number): Observable<number> {
    if (this.modoVehiculo() === 'existente') {
      return of(this.formulario.getRawValue().idVehiculo as number);
    }

    const v = this.formularioVehiculo.getRawValue();
    const dto = {
      placa: (v.placa ?? '').trim(),
      marca: (v.marca ?? '').trim(),
      modelo: (v.modelo ?? '').trim(),
      anio: v.anio ?? null,
      color: v.color || null,
      idCliente
    };

    return this.servicioVehiculo.crear(dto).pipe(
      switchMap(() => this.servicioVehiculo.obtenerTodos()),
      map((lista) =>
        lista
          .filter((x) => x.placa === dto.placa && x.idCliente === idCliente)
          .reduce<Vehiculo | null>((max, x) => (!max || x.idVehiculo > max.idVehiculo ? x : max), null)
      ),
      switchMap((vehiculo) =>
        vehiculo ? of(vehiculo) : throwError(() => new Error('No se pudo ubicar el vehículo recién creado.'))
      ),
      tap((vehiculo) => {
        this.vehiculos.update((lista) => [...lista.filter((x) => x.idVehiculo !== vehiculo.idVehiculo), vehiculo]);
        this.modoVehiculo.set('existente');
        this.formulario.controls.idVehiculo.setValue(vehiculo.idVehiculo);
        this.notificacion.exito(`Vehículo ${vehiculo.placa} registrado.`);
      }),
      map((vehiculo) => vehiculo.idVehiculo)
    );
  }

  verDetalle(orden: OrdenTrabajo): void {
    this.enrutador.navigate(['/ordenes', orden.idOrden]);
  }

  estadoLabel(id: number): string {
    return ETIQUETAS_ESTADO[id] ?? '—';
  }

  estadoVariant(id: number): VarianteInsignia {
    return VARIANTES_ESTADO[id] ?? 'neutro';
  }
}
