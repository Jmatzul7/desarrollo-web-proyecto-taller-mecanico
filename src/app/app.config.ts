import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { interceptorAutenticacion } from './core/interceptors/auth.interceptor';
import { interceptorErrores } from './core/interceptors/error.interceptor';

export const configuracionApp: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([interceptorAutenticacion, interceptorErrores]))
  ]
};
