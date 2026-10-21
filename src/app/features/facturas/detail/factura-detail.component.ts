import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FacturaServicio } from '../../../core/services/factura.service';
import { NotificacionServicio } from '../../../shared/components/toast/toast.service';
import { BotonComponente } from '../../../shared/components/button/button.component';
import { CargadorComponente } from '../../../shared/components/spinner/spinner.component';
import { Factura, PERMISOS } from '../../../core/models';
import { AutenticacionServicio } from '../../../core/services/auth.service';

@Component({
  selector: 'app-factura-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, BotonComponente, CargadorComponente],
  templateUrl: './factura-detail.component.html',
  styleUrl: './factura-detail.component.scss'
})
export class FacturaDetalleComponente implements OnInit {
  private ruta = inject(ActivatedRoute);
  private servicioFactura = inject(FacturaServicio);
  private notificacion = inject(NotificacionServicio);
  private servicioAutenticacion = inject(AutenticacionServicio);

  /** Descargar el PDF es un permiso aparte de ver la factura. */
  readonly puedeDescargarPdf = computed(() => this.servicioAutenticacion.puedeHacer(PERMISOS.FACTURAS_DESCARGAR_PDF));

  readonly cargando = signal(true);
  readonly descargando = signal(false);
  readonly factura = signal<Factura | null>(null);

  private get idFactura(): number {
    return Number(this.ruta.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.servicioFactura.obtenerPorId(this.idFactura).subscribe({
      next: (datos) => {
        this.factura.set(datos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  descargarPdf(): void {
    this.descargando.set(true);
    this.servicioFactura.descargarPdf(this.idFactura).subscribe({
      next: (blob) => {
        this.descargando.set(false);
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `Factura_${this.idFactura}.pdf`;
        enlace.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.descargando.set(false);
        this.notificacion.error('No fue posible descargar el PDF de la factura.');
      }
    });
  }
}
