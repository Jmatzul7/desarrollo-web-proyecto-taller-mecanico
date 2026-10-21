import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FacturaServicio } from '../../../core/services/factura.service';
import { InsigniaComponente } from '../../../shared/components/badge/badge.component';
import { CargadorComponente } from '../../../shared/components/spinner/spinner.component';
import { Factura } from '../../../core/models';

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [CommonModule, InsigniaComponente, CargadorComponente],
  templateUrl: './facturas.component.html',
  styleUrl: './facturas.component.scss'
})
export class FacturasComponente implements OnInit {
  private servicioFactura = inject(FacturaServicio);
  private enrutador = inject(Router);

  readonly cargando = signal(true);
  readonly facturas = signal<Factura[]>([]);

  ngOnInit(): void {
    this.servicioFactura.obtenerTodos().subscribe({
      next: (datos) => {
        this.facturas.set(datos.sort((a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime()));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  verDetalle(factura: Factura): void {
    this.enrutador.navigate(['/facturas', factura.idFactura]);
  }
}
