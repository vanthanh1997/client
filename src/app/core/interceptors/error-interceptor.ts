import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ApiError } from '@core/api/api-error';
import { ApiResponse } from '@core/api/api-response.model';
import { SKIP_ERROR_TOAST } from '@core/api/http-context';
import { TranslateFn } from '@core/i18n/lang';
import { LanguageService } from '@core/i18n/language-service';
import { ToastService } from '@core/services/toast-service';

/**
 * Bảng status -> KHOÁ dịch cho câu dự phòng khi backend không gửi message.
 * KHÔNG có câu chữ nào trong file này: toàn bộ nội dung nằm trong
 * public/i18n/vi.json và public/i18n/en.json (xem Phần 12).
 *
 * Khai `| undefined` để diễn đạt đúng sự thật: bảng này KHÔNG phủ mọi status,
 * nên tra một status lạ thì kết quả thật sự là `undefined`. Kiểu này cũng là
 * kiểu đúng sẵn nếu sau này bật `noUncheckedIndexedAccess`.
 */
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

/**
 * Đọc envelope lỗi từ body của response.
 *
 * Body được khai là `unknown` vì thực tế nó có thể là:
 * - object đúng khuôn ApiResponse (đường đi bình thường của backend này),
 * - chuỗi HTML (nginx trả 502 thay cho backend, hoặc proxy dev chưa chạy),
 * - null (response rỗng),
 * - Error/ProgressEvent (lỗi tầng mạng).
 * Vì vậy phải kiểm tra từng field thay vì ép kiểu thẳng.
 */
function readEnvelope(body: unknown): ErrorEnvelope {
  if (typeof body !== 'object' || body === null) {
    return { message: null, errors: null, traceId: null };
  }

  // Partial<ApiResponse<unknown>> có các property KHAI BÁO SẴN (không phải index
  // signature), nên truy cập bằng dấu chấm ở đây hợp lệ với
  // noPropertyAccessFromIndexSignature.
  const envelope = body as Partial<ApiResponse<unknown>>;

  const message =
    typeof envelope.message === 'string' && envelope.message.length > 0 ? envelope.message : null;

  const traceId =
    typeof envelope.traceId === 'string' && envelope.traceId.length > 0 ? envelope.traceId : null;

  // typeof null === 'object' nên phải loại null tường minh.
  const errors =
    typeof envelope.errors === 'object' && envelope.errors !== null ? envelope.errors : null;

  return { message, errors, traceId };
}

/**
 * Đọc header Retry-After của response 429.
 * Backend đặt header này ở SecuritySetup.OnRejected, đơn vị GIÂY.
 * Đọc được vì request cùng origin (đi qua proxy /api) — cross-origin thì trình
 * duyệt ẩn header này trừ khi server khai Access-Control-Expose-Headers.
 */
function readRetryAfter(error: HttpErrorResponse): number | null {
  const raw = error.headers.get('Retry-After');
  if (raw === null) {
    return null;
  }

  const seconds = Number.parseInt(raw, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

/** Dịch bất kỳ thứ gì rơi vào catchError thành ApiError. */
function toApiError(error: unknown, t: TranslateFn): ApiError {
  // Đã được một interceptor bên trong dịch rồi thì giữ nguyên, không bọc hai lần.
  if (error instanceof ApiError) {
    return error;
  }

  if (!(error instanceof HttpErrorResponse)) {
    // Lỗi lập trình lọt vào stream (ví dụ một operator phía trong ném TypeError).
    // Không có status HTTP nào để gán, dùng 0 và giữ nguyên message để còn debug.
    const message = error instanceof Error ? error.message : t('errors.requestFailed');
    return new ApiError(0, message);
  }

  if (error.status === 0) {
    // KHÔNG đọc body ở nhánh này. Với withFetch(), error.error là một Error thật
    // của trình duyệt, và chuỗi trong đó KHÔNG nằm trong bộ dịch của ta: nó do
    // engine sinh ra, khác nhau theo từng trình duyệt ("Failed to fetch" ở
    // Chrome, "NetworkError when attempting to fetch resource." ở Firefox) và
    // không đổi theo ngôn ngữ người dùng chọn. Luôn dùng khoá dự phòng của ta.
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

/**
 * QUY TẮC TOAST: chỉ toast cho lỗi mà người dùng KHÔNG THỂ nhìn thấy ở trong trang.
 * - mất mạng (status 0): không có gì trong trang phản ánh việc này.
 * - 429       : không gắn với ô nhập nào, và người dùng cần biết phải chờ.
 * - 5xx       : lỗi hệ thống, trang không có chỗ nào để hiển thị.
 * Mọi mã còn lại có nơi hiển thị tốt hơn ngay trong giao diện — xem phần giải thích.
 */
function shouldToast(error: ApiError): boolean {
  return error.isNetwork || error.isTooManyRequests || error.isServerError;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  // inject() ở đây, KHÔNG phải trong catchError: callback của rxjs chạy ngoài
  // injection context và inject() sẽ ném NG0203.
  const toast = inject(ToastService);
  // Hàm dịch cũng phải lấy ở đây, cạnh toast, vì cùng một lý do.
  // LanguageService.t là một field hàm đọc signal ngôn ngữ đang hoạt động,
  // nên câu dự phòng luôn theo ngôn ngữ hiện tại mà không cần tải lại trang.
  const t = inject(LanguageService).t;

  return next(req).pipe(
    catchError((error: unknown) => {
      const apiError = toApiError(error, t);

      // req.context đọc trên request GỐC vẫn đúng vì HttpContext được chia sẻ
      // giữa mọi bản clone của request.
      if (!req.context.get(SKIP_ERROR_TOAST) && shouldToast(apiError)) {
        // ToastService.error nhận đúng MỘT tham số text. traceId đã nằm sẵn trong
        // câu message mà backend sinh cho lỗi 500, không cần truyền thêm.
        toast.error(apiError.message);
      }

      // Luôn ném lại. Interceptor KHÔNG được nuốt lỗi: nơi gọi cần biết để
      // ngừng spinner cục bộ, giữ dữ liệu form, hoặc hiển thị lỗi theo field.
      return throwError(() => apiError);
    }),
  );
};
