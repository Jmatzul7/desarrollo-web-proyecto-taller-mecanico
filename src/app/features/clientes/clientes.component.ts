import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ClienteServicio } from '../../core/services/cliente.service';
import { NotificacionServicio } from '../../shared/components/toast/toast.service';
import { ConfirmacionServicio } from '../../shared/components/confirm-dialog/confirm.service';
import { ModalComponente } from '../../shared/components/modal/modal.component';
import { BotonComponente } from '../../shared/components/button/button.component';
import { InsigniaComponente } from '../../shared/components/badge/badge.component';
import { CargadorComponente } from '../../shared/components/spinner/spinner.component';
import { TienePermisoDirectiva } from '../../core/directives/has-permission.directive';
import { Cliente } from '../../core/models';

@Component({
  selector: 'app-clientes',
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
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponente implements OnInit {
  private servicioCliente = inject(ClienteServicio);
  private notificacion = inject(NotificacionServicio);
  private servicioConfirmacion = inject(ConfirmacionServicio);
  private fb = inject(FormBuilder);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly clientes = signal<Cliente[]>([]);
  readonly busqueda = signal('');
  readonly modalAbierto = signal(false);
  readonly editando = signal<Cliente | null>(null);

  readonly filtrados = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    if (!termino) return this.clientes();
    return this.clientes().filter(
      (c) =>
        c.nombre.toLowerCase().includes(termino) ||
        (c.email ?? '').toLowerCase().includes(termino) ||
        (c.telefono ?? '').toLowerCase().includes(termino)
    );
  });

  formulario = this.fb.group({
    nombre: ['', [Validators.required]],
    telefono: [''],
    email: ['', [Validators.email]],
    direccion: [''],
    activo: [true]
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.servicioCliente.obtenerTodos().subscribe({
      next: (datos) => {
        this.clientes.set(datos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  abrirCrear(): void {
    this.editando.set(null);
    this.formulario.reset({ nombre: '', telefono: '', email: '', direccion: '', activo: true });
    this.modalAbierto.set(true);
  }

  abrirEditar(cliente: Cliente): void {
    this.editando.set(cliente);
    this.formulario.reset({
      nombre: cliente.nombre,
      telefono: cliente.telefono ?? '',
      email: cliente.email ?? '',
      direccion: cliente.direccion ?? '',
      activo: cliente.activo
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

    const solicitud: Observable<unknown> = editando
      ? this.servicioCliente.actualizar(editando.idCliente, {
          nombre: value.nombre ?? '',
          telefono: value.telefono || null,
          email: value.email || null,
          direccion: value.direccion || null,
          activo: value.activo ?? true
        })
      : this.servicioCliente.crear({
          nombre: value.nombre ?? '',
          telefono: value.telefono || null,
          email: value.email || null,
          direccion: value.direccion || null
        });

    solicitud.subscribe({
      next: () => {
        this.guardando.set(false);
        this.notificacion.exito(editando ? 'Cliente actualizado.' : 'Cliente creado.');
        this.modalAbierto.set(false);
        this.cargar();
      },
      error: () => this.guardando.set(false)
    });
  }

  async eliminar(cliente: Cliente): Promise<void> {
    const confirmed = await this.servicioConfirmacion.confirmar({
      titulo: 'Desactivar cliente',
      texto: `¿Seguro que deseas desactivar a "${cliente.nombre}"? Podrás reactivarlo luego editándolo.`,
      textoConfirmar: 'Desactivar',
      variante: 'peligro'
    });
    if (!confirmed) return;

    this.servicioCliente.eliminar(cliente.idCliente).subscribe({
      next: () => {
        this.notificacion.exito('Cliente desactivado.');
        this.cargar();
      }
    });
  }
}
