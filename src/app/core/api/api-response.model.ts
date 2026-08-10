export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly message: string | null;
  readonly errors: Record<string, string[]> | null;
  readonly traceId: string;
}

export type ApiErrorResponse = ApiResponse<null>;
