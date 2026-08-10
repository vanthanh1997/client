import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { ApiError } from '@core/api/api-error';
import { LanguageService } from '@core/i18n/language-service';
import { ToastService } from '@core/services/toast-service';
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);
  handleError(error: unknown): void {
    console.error('[GlobalErrorHandler]', error);
    if (error instanceof ApiError) {
      return;
    }

    try {
      // 'errors.unexpected' nằm trong BOOTSTRAP_KEYS: lỗi có thể nổ TRƯỚC khi bản
      // dịch về, và lúc đó t() vẫn phải trả ra câu hoàn chỉnh chứ không phải khoá.
      const t = this.injector.get(LanguageService).t;
      this.injector.get(ToastService).error(t('errors.unexpected'));
    } catch {
      // Nếu ngay cả việc báo lỗi cũng lỗi (injector đã bị huỷ, ToastService hỏng),
      // dừng tại đây. Ném tiếp từ trong handleError sẽ gọi lại chính handleError
      // và tạo vòng lặp vô hạn treo tab trình duyệt.
    }
  }
}
