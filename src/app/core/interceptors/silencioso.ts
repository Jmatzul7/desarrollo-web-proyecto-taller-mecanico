import { HttpContextToken } from '@angular/common/http';

/**
 * Marca una petición como "de fondo" (por ejemplo, el refresco periódico de
 * permisos): si falla por un problema de conexión o del servidor no se muestra
 * una notificación de error. Un 401 sí cierra la sesión.
 */
export const PETICION_SILENCIOSA = new HttpContextToken<boolean>(() => false);
