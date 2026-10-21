import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AutenticacionServicio } from '../../../core/services/auth.service';
import { BotonComponente } from '../../../shared/components/button/button.component';
import { ROL } from '../../../core/models';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, BotonComponente],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegistroComponente {
  private fb = inject(FormBuilder);
  private servicioAutenticacion = inject(AutenticacionServicio);

  readonly cargando = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly exito = signal(false);

  // GET /api/catalogos/roles exige estar autenticado (no tiene [AllowAnonymous]
  // en el backend), así que en el registro público — que ocurre sin sesión —
  // no podemos consultarlo. Se hardcodean los roles autoasignables, que
  // coinciden con el seed de la base de datos (Administrador = 1 queda
  // excluido porque el backend lo rechaza de todas formas).
  readonly roles = [
    { idRol: ROL.RECEPCIONISTA, nombre: 'Recepcionista' },
    { idRol: ROL.MECANICO, nombre: 'Mecanico' },
    { idRol: ROL.BODEGUERO, nombre: 'Bodeguero' }
  ];

  formulario = this.fb.group({
    nombreUsuario: ['', [Validators.required, Validators.minLength(3)]],
    nombreCompleto: ['', [Validators.required]],
    email: ['', [Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    idRol: [null as number | null, [Validators.required]]
  });

  enviar(): void {
    this.mensajeError.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    const value = this.formulario.getRawValue();

    this.servicioAutenticacion
      .registro({
        nombreUsuario: value.nombreUsuario ?? '',
        password: value.password ?? '',
        nombreCompleto: value.nombreCompleto ?? '',
        email: value.email || null,
        idRol: value.idRol ?? 0
      })
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.exito.set(true);
        },
        error: (err) => {
          this.cargando.set(false);
          this.mensajeError.set(err?.error?.mensaje ?? 'No fue posible completar el registro.');
        }
      });
  }
}
