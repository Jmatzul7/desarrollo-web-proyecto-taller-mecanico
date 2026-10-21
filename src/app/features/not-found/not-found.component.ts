import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AutenticacionServicio } from '../../core/services/auth.service';

@Component({
  selector: 'app-no-encontrado',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NoEncontradoComponente {
  servicioAutenticacion = inject(AutenticacionServicio);
}
