import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AutenticacionServicio } from '../../core/services/auth.service';
import { VigilanciaPermisosServicio } from '../../core/services/permission-watch.service';
import { ModalComponente } from '../../shared/components/modal/modal.component';
import { BotonComponente } from '../../shared/components/button/button.component';
import { PERMISOS } from '../../core/models';

interface ItemNavegacion {
  etiqueta: string;
  icono: string;
  ruta: string;
  roles?: readonly string[];
  permiso?: string;
}

@Component({
  selector: 'app-disposicion-principal',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ModalComponente, BotonComponente],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class DisposicionPrincipalComponente implements OnInit, OnDestroy {
  servicioAutenticacion = inject(AutenticacionServicio);
  private vigilancia = inject(VigilanciaPermisosServicio);
  private enrutador = inject(Router);
  readonly modalPermisosAbierto = signal(false);

  /** Permisos granulares del usuario con su descripción, para el modal "Mis permisos". */
  readonly misPermisos = computed(() =>
    (this.servicioAutenticacion.sesion()?.permisos ?? []).map((nombre) => ({
      nombre,
      descripcion: this.vigilancia.descripcion(nombre)
    }))
  );
  readonly barraLateralAbierta = signal(true);
  readonly menuUsuarioAbierto = signal(false);

  readonly itemsNavegacion: ItemNavegacion[] = [
    { etiqueta: 'Panel', icono: '◧', ruta: '/' },
    { etiqueta: 'Clientes', icono: '◉', ruta: '/clientes', ...PERMISOS.CLIENTES_VER },
    { etiqueta: 'Vehículos', icono: '◈', ruta: '/vehiculos', ...PERMISOS.VEHICULOS_VER },
    { etiqueta: 'Órdenes de trabajo', icono: '▤', ruta: '/ordenes' },
    { etiqueta: 'Repuestos / Bodega', icono: '▣', ruta: '/repuestos', ...PERMISOS.REPUESTOS_VER },
    { etiqueta: 'Facturas', icono: '▦', ruta: '/facturas', ...PERMISOS.FACTURAS_VER },
    { etiqueta: 'Usuarios', icono: '◎', ruta: '/usuarios', roles: ['Administrador'] },
    { etiqueta: 'Permisos', icono: '✦', ruta: '/permisos', roles: ['Administrador'] }
  ];

  ngOnInit(): void {
    this.vigilancia.iniciar();
  }

  ngOnDestroy(): void {
    this.vigilancia.detener();
  }

  alternarBarraLateral(): void {
    this.barraLateralAbierta.update((v) => !v);
  }

  alternarMenuUsuario(): void {
    this.menuUsuarioAbierto.update((v) => !v);
  }

  irAPerfil(): void {
    this.menuUsuarioAbierto.set(false);
    this.enrutador.navigate(['/perfil']);
  }

  abrirMisPermisos(): void {
    this.menuUsuarioAbierto.set(false);
    this.modalPermisosAbierto.set(true);
  }

  cerrarSesion(): void {
    this.servicioAutenticacion.cerrarSesion();
  }

  puedeVer(elemento: ItemNavegacion): boolean {
    if (!elemento.roles && !elemento.permiso) return true;
    const rolOk = elemento.roles ? this.servicioAutenticacion.tieneRol(...elemento.roles) : false;
    const permisoOk = elemento.permiso ? this.servicioAutenticacion.poseePermiso(elemento.permiso) : false;
    return rolOk || permisoOk;
  }
}
