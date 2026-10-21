import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AutenticacionServicio } from '../../../core/services/auth.service';
import { BotonComponente } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BotonComponente],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class InicioSesionComponente {
  private fb = inject(FormBuilder);
  private servicioAutenticacion = inject(AutenticacionServicio);
  private enrutador = inject(Router);

  readonly cargando = signal(false);
  readonly mensajeError = signal<string | null>(null);

  formulario = this.fb.group({
    nombreUsuario: ['', [Validators.required]],
    password: ['', [Validators.required]],
    recordar: [false]
  });

  get nombreUsuario() {
    return this.formulario.controls.nombreUsuario;
  }
  get password() {
    return this.formulario.controls.password;
  }

  enviar(): void {
    this.mensajeError.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.servicioAutenticacion
      .iniciarSesion({
        nombreUsuario: this.nombreUsuario.value ?? '',
        password: this.password.value ?? ''
      })
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.enrutador.navigate(['/']);
        },
        error: (err) => {
          this.cargando.set(false);
          this.mensajeError.set(err?.error?.mensaje ?? 'No fue posible iniciar sesión.');
        }
      });
  }
}
