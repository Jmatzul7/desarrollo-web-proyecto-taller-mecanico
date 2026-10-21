import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PermisoServicio } from '../../core/services/permiso.service';
import { UsuarioServicio } from '../../core/services/usuario.service';
import { NotificacionServicio } from '../../shared/components/toast/toast.service';
import { CargadorComponente } from '../../shared/components/spinner/spinner.component';
import { InsigniaComponente } from '../../shared/components/badge/badge.component';
import { Permiso, Usuario } from '../../core/models';

@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [CommonModule, CargadorComponente, InsigniaComponente],
  templateUrl: './permisos.component.html',
  styleUrl: './permisos.component.scss'
})
export class PermisosComponente implements OnInit {
  private ruta = inject(ActivatedRoute);
  private enrutador = inject(Router);
  private servicioPermiso = inject(PermisoServicio);
  private servicioUsuario = inject(UsuarioServicio);
  private notificacion = inject(NotificacionServicio);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly usuarios = signal<Usuario[]>([]);
  readonly catalogo = signal<Permiso[]>([]);
  readonly asignados = signal<Set<number>>(new Set());
  readonly usuarioSeleccionado = signal<Usuario | null>(null);
  readonly busqueda = signal('');

  readonly usuariosFiltrados = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    const activos = this.usuarios().filter((u) => u.activo);
    if (!termino) return activos;
    return activos.filter(
      (u) => u.nombreUsuario.toLowerCase().includes(termino) || u.nombreCompleto.toLowerCase().includes(termino)
    );
  });

  // Agrupa los permisos granulares por prefijo de recurso (recurso.accion) para una interfaz más clara.
  readonly agrupados = computed(() => {
    const groups = new Map<string, Permiso[]>();
    for (const permiso of this.catalogo()) {
      const [recurso] = permiso.nombre.split('.');
      const key = recurso || 'otros';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(permiso);
    }
    return Array.from(groups.entries()).map(([recurso, permisos]) => ({ recurso, permisos }));
  });

  private get idUsuarioParam(): number | null {
    const raw = this.ruta.snapshot.paramMap.get('idUsuario');
    return raw ? Number(raw) : null;
  }

  ngOnInit(): void {
    this.servicioPermiso.obtenerCatalogo().subscribe({ next: (datos) => this.catalogo.set(datos) });

    const idUsuario = this.idUsuarioParam;
    if (idUsuario) {
      this.cargarUsuario(idUsuario);
    } else {
      this.servicioUsuario.obtenerTodos().subscribe({
        next: (datos) => {
          this.usuarios.set(datos);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false)
      });
    }
  }

  private cargarUsuario(idUsuario: number): void {
    this.cargando.set(true);
    forkJoin({
      usuario: this.servicioUsuario.obtenerPorId(idUsuario),
      permisos: this.servicioPermiso.obtenerDeUsuario(idUsuario)
    }).subscribe({
      next: ({ usuario, permisos }) => {
        this.usuarioSeleccionado.set(usuario);
        this.asignados.set(new Set(permisos.map((p) => p.idPermiso)));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  seleccionar(usuario: Usuario): void {
    this.enrutador.navigate(['/permisos', usuario.idUsuario]);
  }

  volver(): void {
    this.enrutador.navigate(['/permisos']);
  }

  tienePermiso(idPermiso: number): boolean {
    return this.asignados().has(idPermiso);
  }

  alternar(permiso: Permiso): void {
    const usuario = this.usuarioSeleccionado();
    if (!usuario || this.guardando()) return;

    const yaAsignado = this.tienePermiso(permiso.idPermiso);
    this.guardando.set(true);

    const solicitud = yaAsignado
      ? this.servicioPermiso.revocar(usuario.idUsuario, permiso.idPermiso)
      : this.servicioPermiso.asignar(usuario.idUsuario, permiso.idPermiso);

    solicitud.subscribe({
      next: () => {
        this.guardando.set(false);
        const nuevo = new Set(this.asignados());
        if (yaAsignado) nuevo.delete(permiso.idPermiso);
        else nuevo.add(permiso.idPermiso);
        this.asignados.set(nuevo);
        this.notificacion.exito(
          (yaAsignado ? `Permiso «${permiso.descripcion ?? permiso.nombre}» retirado a ` : `Permiso «${permiso.descripcion ?? permiso.nombre}» asignado a `) +
            `${usuario.nombreCompleto}. Lo verá reflejado en unos segundos, sin cerrar sesión.`
        );
      },
      error: () => this.guardando.set(false)
    });
  }
}
