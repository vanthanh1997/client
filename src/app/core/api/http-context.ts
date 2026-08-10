import { HttpContext, HttpContextToken } from '@angular/common/http';

export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);
export const SKIP_LANG = new HttpContextToken<boolean>(() => false);

export interface HttpFlags {
  readonly skipAuth?: boolean;
  readonly skipErrorToast?: boolean;
  readonly skipLoading?: boolean;
  /** (2) */
  readonly skipLang?: boolean;
}

export function httpFlags(flags: HttpFlags): HttpContext {
  const context = new HttpContext();

  if (flags.skipAuth === true) context.set(SKIP_AUTH, true);
  if (flags.skipErrorToast === true) context.set(SKIP_ERROR_TOAST, true);
  if (flags.skipLoading === true) context.set(SKIP_LOADING, true);
  if (flags.skipLang === true) context.set(SKIP_LANG, true); 

  return context;
}

export function silentRequest(): HttpContext {
  return httpFlags({ skipErrorToast: true, skipLoading: true });
}

export function publicRequest(): HttpContext {
  return httpFlags({ skipAuth: true });
}
