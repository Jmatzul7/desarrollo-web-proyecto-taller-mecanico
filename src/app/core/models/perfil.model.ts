export interface PerfilActualizar {
  nombreUsuario: string;
  nombreCompleto: string;
  email?: string | null;
}

export interface CambiarPassword {
  passwordActual: string;
  passwordNueva: string;
}
