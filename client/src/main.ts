import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import localeEn from '@angular/common/locales/en';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

registerLocaleData(localeEs);
registerLocaleData(localeEn, 'en-US');

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
