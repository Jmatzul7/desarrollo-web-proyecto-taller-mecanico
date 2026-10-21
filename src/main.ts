import { bootstrapApplication } from '@angular/platform-browser';
import { configuracionApp } from './app/app.config';
import { AppComponente } from './app/app.component';

bootstrapApplication(AppComponente, configuracionApp)
  .catch((err) => console.error(err));
