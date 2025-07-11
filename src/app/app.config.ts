import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { icons } from './icons-provider';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { FormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { ErrorInterceptor } from './interceptors/error.interceptor';

registerLocaleData(en);

// Configuración de proveedores para servicios globales
const GLOBAL_PROVIDERS = [
  // Servicios de la aplicación
  NzMessageService,
  
  // Interceptores HTTP
  { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideNzIcons(icons),
    provideNzI18n(en_US),
    provideHttpClient(withInterceptorsFromDi()),
    
    // Módulos de NG-ZORRO
    importProvidersFrom(FormsModule),
    importProvidersFrom(NzFormModule),
    importProvidersFrom(NzInputModule),
    importProvidersFrom(NzSelectModule),
    importProvidersFrom(NzButtonModule),
    importProvidersFrom(NzUploadModule),
    importProvidersFrom(NzCardModule),
    importProvidersFrom(NzGridModule),
    importProvidersFrom(NzModalModule),
    importProvidersFrom(NzToolTipModule),
    importProvidersFrom(NzEmptyModule),
    importProvidersFrom(NzAlertModule),
    importProvidersFrom(NzSpinModule),
    importProvidersFrom(NzPaginationModule),
    importProvidersFrom(NzMessageModule),
    
    // Proveedores globales
    ...GLOBAL_PROVIDERS,
    provideAnimationsAsync(),
    provideHttpClient()
  ]
};
