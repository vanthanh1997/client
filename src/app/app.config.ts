import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api/api.tokens';
import { GlobalErrorHandler } from '@core/errors/global-error-handler';
import { errorInterceptor } from '@core/interceptors/error-interceptor';
import { loadingInterceptor } from '@core/interceptors/loading-interceptor';
import { environment } from '@env/environment';
import { routes } from './app.routes';
import { provideTranslateService } from '@ngx-translate/core';
import { langInterceptor } from '@core/interceptors/lang-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([loadingInterceptor, langInterceptor, errorInterceptor]),
    ),
   provideTranslateService({
      fallbackLang: 'en',
      lang: 'en'
    }),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
