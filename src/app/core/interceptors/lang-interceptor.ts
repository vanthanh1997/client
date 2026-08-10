import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_BASE_URL } from '@core/api/api.tokens';
import { SKIP_LANG } from '@core/api/http-context';
import { ACCEPT_LANGUAGE } from '@core/i18n/lang';
import { LanguageService } from '@core/i18n/language-service';

export const langInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);
  const language = inject(LanguageService);

  if (req.context.get(SKIP_LANG)) {
    return next(req);
  }

  if (!req.url.startsWith(baseUrl)) {
    return next(req);
  }

  return next(
    req.clone({ setHeaders: { 'Accept-Language': ACCEPT_LANGUAGE[language.active()] } }),
  );
};
