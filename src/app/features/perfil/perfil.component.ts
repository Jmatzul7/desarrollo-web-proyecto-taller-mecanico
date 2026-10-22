import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl, AsyncValidatorFn, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';
import { Observable, catchError, map, of, switchMap, timer } from 'rxjs';
import { AutenticacionServicio } from '../../core/services/auth.service';
import { PerfilServicio } from '../../core/services/perfil.service';
import { NotificacionServicio } from '../../shared/components/toast/toast.service';
import { BotonComponente } from '../../shared/components/button/button.component';
import { ModalComponente } from '../../shared/components/modal/modal.component';
import { Usuario } from '../../core/models';

const PATRON_USUARIO = /^[A-Za-z0-9._-]{3,50}$/;

/** Las dos contraseñas deben coincidir. Vive en el formulario de contraseña, no en el de datos. */
const coincidenPasswords: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
  const nueva = grupo.get('passwordNueva')?.value;
  const confirmar = grupo.get('confirmar')?.value;
  return nueva && confirmar && nueva !== confirmar ? { noCoinciden: true } : null;
};

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BotonComponente, ModalComponente],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss'
})
export class PerfilComponente implements OnInit {
  private fb = inject(FormBuilder);
  private perfilServicio = inject(PerfilServicio);
  private autenticacion = inject(AutenticacionServicio);
  private notificacion = inject(NotificacionServicio);

  readonly sesion = this.autenticacion.sesion;
  readonly cargando = signal(true);
  readonly guardandoDatos = signal(false);
  readonly guardandoPassword = signal(false);
  readonly usuario = signal<Usuario | null>(null);
  readonly modalDatosAbierto = signal(false);
  readonly modalPasswordAbierto = signal(false);
  readonly cantidadPermisos = computed(() => this.sesion()?.permisos.length ?? 0);
  readonly iniciales = computed(() => {
    const nombre = (this.usuario()?.nombreCompleto ?? this.sesion()?.nombreCompleto ?? '').trim();
    const partes = nombre.split(/\s+/).filter(Boolean);
    return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase() || '?';
  });

  /** Nombre de usuario guardado actualmente; el validador asíncrono no consulta si no cambia. */
  private nombreUsuarioActual = '';

  readonly formularioDatos = this.fb.nonNullable.group({
    nombreUsuario: ['', {
      validators: [Validators.required, Validators.pattern(PATRON_USUARIO)],
      asyncValidators: [this.validadorNombreUsuarioLibre()],
      updateOn: 'change'
    }],
    nombreCompleto: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.email, Validators.maxLength(150)]]
  });

  /** Formulario independiente: no contiene el campo de usuario ni su validador. */
  readonly formularioPassword = this.fb.nonNullable.group(
    {
      passwordActual: ['', Validators.required],
      passwordNueva: ['', [Validators.required, Validators.minLength(6)]],
      confirmar: ['', Validators.required]
    },
    { validators: coincidenPasswords }
  );

  ngOnInit(): void {
    this.perfilServicio.obtener().subscribe({
      next: (u) => {
        this.usuario.set(u);
        this.rellenarDatos(u);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  private rellenarDatos(u: Usuario): void {
    this.nombreUsuarioActual = u.nombreUsuario;
    this.formularioDatos.reset({
      nombreUsuario: u.nombreUsuario,
      nombreCompleto: u.nombreCompleto,
      email: u.email ?? ''
    });
  }

  private validadorNombreUsuarioLibre(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const valor = String(control.value ?? '').trim();
      // Sin consulta si está vacío, mal formado o sigue siendo el mismo usuario.
      if (!valor || !PATRON_USUARIO.test(valor) || valor === this.nombreUsuarioActual) return of(null);
      return timer(400).pipe(
        switchMap(() => this.perfilServicio.nombreUsuarioDisponible(valor)),
        map((disponible) => (disponible ? null : { usuarioEnUso: true })),
        catchError(() => of(null)) // si falla la consulta, el backend valida igual al guardar
      );
    };
  }

  get nombreUsuarioDisponible(): boolean {
    const c = this.formularioDatos.controls.nombreUsuario;
    return c.valid && c.dirty && c.value.trim() !== this.nombreUsuarioActual;
  }

  get datosSinCambios(): boolean {
    const u = this.usuario();
    if (!u) return true;
    const v = this.formularioDatos.getRawValue();
    return (
      v.nombreUsuario.trim() === u.nombreUsuario &&
      v.nombreCompleto.trim() === u.nombreCompleto &&
      v.email.trim() === (u.email ?? '')
    );
  }

  abrirEditarDatos(): void {
    const u = this.usuario();
    if (u) this.rellenarDatos(u);
    this.modalDatosAbierto.set(true);
  }

  cerrarEditarDatos(): void {
    this.modalDatosAbierto.set(false);
  }

  abrirCambiarPassword(): void {
    this.formularioPassword.reset({ passwordActual: '', passwordNueva: '', confirmar: '' });
    this.modalPasswordAbierto.set(true);
  }

  cerrarCambiarPassword(): void {
    this.modalPasswordAbierto.set(false);
  }

  guardarDatos(): void {
    if (this.formularioDatos.invalid || this.formularioDatos.pending || this.datosSinCambios) {
      this.formularioDatos.markAllAsTouched();
      return;
    }
    const v = this.formularioDatos.getRawValue();
    this.guardandoDatos.set(true);
    this.perfilServicio
      .actualizar({
        nombreUsuario: v.nombreUsuario.trim(),
        nombreCompleto: v.nombreCompleto.trim(),
        email: v.email.trim() || null
      })
      .subscribe({
        next: (respuesta) => {
          this.autenticacion.aplicarToken(respuesta.token);
          const u = this.usuario();
          if (u) {
            const nuevo = { ...u, nombreUsuario: respuesta.nombreUsuario, nombreCompleto: respuesta.nombreCompleto, email: v.email.trim() || null };
            this.usuario.set(nuevo);
            this.rellenarDatos(nuevo);
          }
          this.guardandoDatos.set(false);
          this.modalDatosAbierto.set(false);
          this.notificacion.exito('Perfil actualizado correctamente.');
        },
        error: () => {
          this.guardandoDatos.set(false);
          // Revalida por si el nombre fue tomado entre tanto.
          this.formularioDatos.controls.nombreUsuario.updateValueAndValidity();
        }
      });
  }

  cambiarPassword(): void {
    if (this.formularioPassword.invalid) {
      this.formularioPassword.markAllAsTouched();
      return;
    }
    const v = this.formularioPassword.getRawValue();
    this.guardandoPassword.set(true);
    // Solo se envían las contraseñas: nada del nombre de usuario ni de su validación.
    this.perfilServicio.cambiarPassword({ passwordActual: v.passwordActual, passwordNueva: v.passwordNueva }).subscribe({
      next: () => {
        this.guardandoPassword.set(false);
        this.formularioPassword.reset({ passwordActual: '', passwordNueva: '', confirmar: '' });
        this.modalPasswordAbierto.set(false);
        this.notificacion.exito('Contraseña actualizada correctamente.');
      },
      error: () => this.guardandoPassword.set(false)
    });
  }
}
