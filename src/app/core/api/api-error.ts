export class ApiError extends Error {
  readonly status: number;
  readonly errors: Record<string, string[]> | null;
  readonly traceId: string | null;
  readonly retryAfterSeconds: number | null;

  constructor(
    status: number,
    message: string,
    errors: Record<string, string[]> | null = null,
    traceId: string | null = null,
    retryAfterSeconds: number | null = null,
  ) {
    super(message);

    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.traceId = traceId;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  get isNetwork(): boolean {
    return this.status === 0;
  }

  get isValidation(): boolean {
    return this.status === 400;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isTooManyRequests(): boolean {
    return this.status === 429;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }

  fieldErrors(field: string): readonly string[] {
    const errors = this.errors;
    if (errors === null) {
      return [];
    }

    const target = field.toLowerCase();
    for (const key of Object.keys(errors)) {
      if (key.toLowerCase() === target) {
        return errors[key] ;
      }
    }

    return [];
  }

  fieldError(field: string): string | null {
    const messages = this.fieldErrors(field);
    return messages[0] ;
  }

  get hasFieldErrors(): boolean {
    return this.errors !== null && Object.keys(this.errors).length > 0;
  }
}
