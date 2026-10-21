import { Injectable, signal } from '@angular/core';

export interface OpcionesConfirmacion {
  titulo: string;
  texto: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  variante?: 'peligro' | 'primario';
}

interface EstadoConfirmacion extends OpcionesConfirmacion {
  abierto: boolean;
  resolver?: (valor: boolean) => void;
}

/**
 * Diálogo de confirmación global único. <app-dialogo-confirmacion> se renderiza
 * una sola vez en AppComponente y lee `estadoDialogo()`; cualquier componente
 * llama a `servicioConfirmacion.confirmar({...})` y espera el resultado booleano
 * en lugar de usar el confirm() nativo del navegador.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmacionServicio {
  readonly estadoDialogo = signal<EstadoConfirmacion>({
    abierto: false,
    titulo: '',
    texto: ''
  });

  confirmar(opciones: OpcionesConfirmacion): Promise<boolean> {
    return new Promise<boolean>((resolver) => {
      this.estadoDialogo.set({
        abierto: true,
        titulo: opciones.titulo,
        texto: opciones.texto,
        textoConfirmar: opciones.textoConfirmar ?? 'Confirmar',
        textoCancelar: opciones.textoCancelar ?? 'Cancelar',
        variante: opciones.variante ?? 'primario',
        resolver
      });
    });
  }

  resolver(resultado: boolean): void {
    this.estadoDialogo().resolver?.(resultado);
    this.estadoDialogo.set({ ...this.estadoDialogo(), abierto: false });
  }
}
