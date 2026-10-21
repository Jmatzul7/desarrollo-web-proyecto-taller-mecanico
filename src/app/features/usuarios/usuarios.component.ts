import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { UsuarioServicio } from '../../core/services/usuario.service';
import { CatalogoServicio } from '../../core/services/catalogo.service';
import { NotificacionServicio } from '../../shared/components/toast/toast.service';
import { ConfirmacionServicio } from '../../shared/components/confirm-dialog/confirm.service';
import { ModalComponente } from '../../shared/components/modal/modal.component';
import { BotonComponente } from '../../shared/components/button/button.component';
import { InsigniaComponente } from '../../shared/components/badge/badge.component';
import { CargadorComponente } from '../../shared/components/spinner/spinner.component';
import { Usuario, Rol } from '../../core/models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ModalComponente,
    BotonComponente,
    InsigniaComponente,
    CargadorComponente
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export class UsuariosComponente implements OnInit {
  private servicioUsuario = inject(UsuarioServicio);
  private servicioCatalogo = inject(CatalogoServicio);
  private notificacion = inject(NotificacionServicio);
  private servicioConfirmacion = inject(ConfirmacionServicio);
  private fb = inject(FormBuilder);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly usuarios = signal<Usuario[]>([]);
  readonly roles = signal<Rol[]>([]);
  readonly busqueda = signal('');
  readonly modalAbierto = signal(false);
  readonly editando = signal<Usuario | null>(null);

  readonly filtrados = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    if (!termino) return this.usuarios();
    return this.usuarios().filter(
      (u) =>
        u.nombreUsuario.toLowerCase().includes(termino) ||
        u.nombreCompleto.toLowerCase().includes(termino) ||
        (u.email ?? '').toLowerCase().includes(termino)
    );
  });

  readonly pendientes = computed(() => this.usuarios().filter((u) => !u.activo));

  formularioCreacion = this.fb.group({
    nombreUsuario: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    nombreCompleto: ['', [Validators.required]],
    email: ['', [Validators.email]],
    idRol: [null as number | null, [Validators.required]]
  });

  formularioEdicion = this.fb.group({
    nombreCompleto: ['', [Validators.required]],
    email: ['', [Validators.email]],
    idRol: [null as number | null, [Validators.required]],
    activo: [true]
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    forkJoin({
      usuarios: this.servicioUsuario.obtenerTodos(),
      roles: this.servicioCatalogo.obtenerRoles()
    }).subscribe({
      next: ({ usuarios, roles }) => {
        this.usuarios.set(usuarios);
        this.roles.set(roles);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  abrirCrear(): void {
    this.editando.set(null);
    this.formularioCreacion.reset({ nombreUsuario: '', password: '', nombreCompleto: '', email: '', idRol: null });
    this.modalAbierto.set(true);
  }

  abrirEditar(usuario: Usuario): void {
    this.editando.set(usuario);
    this.formularioEdicion.reset({
      nombreCompleto: usuario.nombreCompleto,
      email: usuario.email ?? '',
      idRol: usuario.idRol,
      activo: usuario.activo
    });
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  guardar(): void {
    const editando = this.editando();

    if (editando) {
      if (this.formularioEdicion.invalid) {
        this.formularioEdicion.markAllAsTouched();
        return;
      }
      const value = this.formularioEdicion.getRawValue();
      this.guardando.set(true);
      this.servicioUsuario
        .actualizar(editando.idUsuario, {
          nombreCompleto: value.nombreCompleto ?? '',
          email: value.email || null,
          idRol: value.idRol ?? 0,
          activo: value.activo ?? true
        })
        .subscribe({
          next: () => {
            this.guardando.set(false);
            this.notificacion.exito('Usuario actualizado.');
            this.modalAbierto.set(false);
            this.cargar();
          },
          error: () => this.guardando.set(false)
        });
    } else {
      if (this.formularioCreacion.invalid) {
        this.formularioCreacion.markAllAsTouched();
        return;
      }
      const value = this.formularioCreacion.getRawValue();
      this.guardando.set(true);
      this.servicioUsuario
        .crear({
          nombreUsuario: value.nombreUsuario ?? '',
          password: value.password ?? '',
          nombreCompleto: value.nombreCompleto ?? '',
          email: value.email || null,
          idRol: value.idRol ?? 0
        })
        .subscribe({
          next: () => {
            this.guardando.set(false);
            this.notificacion.exito('Usuario creado.');
            this.modalAbierto.set(false);
            this.cargar();
          },
          error: () => this.guardando.set(false)
        });
    }
  }

  activar(usuario: Usuario): void {
    this.servicioUsuario
      .actualizar(usuario.idUsuario, {
        nombreCompleto: usuario.nombreCompleto,
        email: usuario.email,
        idRol: usuario.idRol,
        activo: true
      })
      .subscribe({
        next: () => {
          this.notificacion.exito(`Cuenta de ${usuario.nombreCompleto} activada.`);
          this.cargar();
        }
      });
  }

  async desactivar(usuario: Usuario): Promise<void> {
    const confirmed = await this.servicioConfirmacion.confirmar({
      titulo: 'Desactivar usuario',
      texto: `¿Seguro que deseas desactivar a "${usuario.nombreCompleto}"? No podrá iniciar sesión.`,
      textoConfirmar: 'Desactivar',
      variante: 'peligro'
    });
    if (!confirmed) return;

    this.servicioUsuario.eliminar(usuario.idUsuario).subscribe({
      next: () => {
        this.notificacion.exito('Usuario desactivado.');
        this.cargar();
      }
    });
  }
}
