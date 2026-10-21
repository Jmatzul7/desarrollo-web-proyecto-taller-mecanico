import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ContenedorNotificacionesComponente } from './shared/components/toast/toast-container.component';
import { DialogoConfirmacionComponente } from './shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ContenedorNotificacionesComponente, DialogoConfirmacionComponente],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponente {
  title = 'taller-mecanico-frontend';
}
