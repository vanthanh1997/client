import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '@core/api/api-error';
import { ApiResponse } from '@core/api/api-response.model';
import { SKIP_ERROR_TOAST } from '@core/api/http-context';
import { TranslateFn } from '@core/i18n/lang';
import { LanguageService } from '@core/i18n/language-service';
import { ToastService } from '@core/services/toast-service';

const MESSAGE_KEY_BY_STATUS: Record<number, string | undefined> = {
  0: 'errors.network',
  400: 'errors.badRequest',
  401: 'errors.unauthorized',
  403: 'errors.forbidden',
  404: 'errors.notFound',
  409: 'errors.conflict',
  429: 'errors.tooManyRequests',
};

function defaultMessage(status: number, t: TranslateFn): string {
  const key = MESSAGE_KEY_BY_STATUS[status];
  if (key !== undefined) {
    return t(key);
  }
  if (status >= 500) {
    return t('errors.serverError');
  }
  return t('errors.requestFailed');
}

interface ErrorEnvelope {
  readonly message: string | null;
  readonly errors: Record<string, string[]> | null;
  readonly traceId: string | null;
}
function readEnvelope(body: unknown): ErrorEnvelope {
  if (typeof body !== 'object' || body === null) {
    return { message: null, errors: null, traceId: null };
  }
  const envelope = body as Partial<ApiResponse<unknown>>;

  const message =
    typeof envelope.message === 'string' && envelope.message.length > 0 ? envelope.message : null;

  const traceId =
    typeof envelope.traceId === 'string' && envelope.traceId.length > 0 ? envelope.traceId : null;

  const errors =
    typeof envelope.errors === 'object' && envelope.errors !== null ? envelope.errors : null;

  return { message, errors, traceId };
}
function readRetryAfter(error: HttpErrorResponse): number | null {
  const raw = error.headers.get('Retry-After');
  if (raw === null) {
    return null;
  }

  const seconds = Number.parseInt(raw, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}
function toApiError(error: unknown, t: TranslateFn): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (!(error instanceof HttpErrorResponse)) {
    const message = error instanceof Error ? error.message : t('errors.requestFailed');
    return new ApiError(0, message);
  }

  if (error.status === 0) {
    return new ApiError(0, defaultMessage(0, t));
  }

  const envelope = readEnvelope(error.error);

  return new ApiError(
    error.status,
    envelope.message ?? defaultMessage(error.status, t),
    envelope.errors,
    envelope.traceId,
    readRetryAfter(error),
  );
}

function shouldToast(error: ApiError): boolean {
  return error.isNetwork || error.isTooManyRequests || error.isServerError;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {

  const toast = inject(ToastService);
  const t = inject(LanguageService).t;
  return next(req).pipe(
    catchError((error: unknown) => {
      const apiError = toApiError(error, t);

      if (!req.context.get(SKIP_ERROR_TOAST) && shouldToast(apiError)) {
        toast.error(apiError.message);
      }

      return throwError(() => apiError);
    }),
  );
};
