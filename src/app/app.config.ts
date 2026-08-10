import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';

import { API_BASE_URL } from '@core/api';
import { GlobalErrorHandler } from '@core/errors/global-error-handler';
import { errorInterceptor } from '@core/interceptors/error-interceptor';
import { langInterceptor } from '@core/interceptors/lang-interceptor';
import { loadingInterceptor } from '@core/interceptors/loading-interceptor';
import { AppTitleStrategy } from '@core/seo/app-title-strategy';
import { environment } from '@env/environment';
import { routes } from './app.routes';
import { provideTranslateService } from '@ngx-translate/core';

/**
 * Ngôn ngữ đã lưu, đọc ĐỒNG BỘ từ localStorage.
 *
 * Đây là bản tối giản của bước 3. Phần 12 thay nó bằng `readStoredLang()` nhập
 * từ '@core/i18n/locale-storage' (bản đó có thêm bộ nhớ đệm trong RAM cho chế độ
 * duyệt riêng tư của Safari, nơi getItem/setItem ném lỗi). Khi làm Phần 12, XOÁ
 * hàm này và đổi import — đừng để tồn tại hai nơi cùng biết khoá 'shop.lang'.
 *
 * try/catch là bắt buộc: hàm này chạy lúc Angular đang DỰNG injector, chỗ chưa
 * có ErrorHandler nào bắt giúp. Một exception ở đây là trang trắng.
 */
function readStoredLang(): string {
  try {
    const raw = localStorage.getItem('shop.lang');
    return raw === 'vi' || raw === 'en' ? raw : 'vi';
  } catch {
    return 'vi';
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    // 1. Bắt lỗi rơi ra window ('error') và promise bị reject mà không catch
    //    ('unhandledrejection'), rồi đẩy vào ErrorHandler. Không có nó thì lỗi
    //    trong setTimeout hay trong .then() chỉ hiện ở console của trình duyệt.
    provideBrowserGlobalErrorListeners(),

    // 2. Angular 21 đã zoneless mặc định khi không có zone.js. Khai tường minh
    //    để việc "dự án này zoneless" là điều đọc được trong code, không phải
    //    suy ra từ việc thiếu một dependency.
    provideZonelessChangeDetection(),

    // 3. Router. Luôn đứng TRƯỚC provider TitleStrategy ở cuối mảng (xem giải thích).
    provideRouter(
      routes,

      // Gắn params/queryParams/data của route vào input() cùng tên của component
      // được route. Bước 4 dùng trực tiếp: confirm-email?userId=..&token=..
      // trở thành hai input() thay vì phải subscribe ActivatedRoute.
      withComponentInputBinding(),

      // scrollPositionRestoration 'enabled': Back/Forward trả về đúng vị trí cuộn cũ;
      //   điều hướng tiến thì về đầu trang. Mặc định là 'disabled' -> giữ nguyên
      //   vị trí cuộn khi sang trang mới, trông như trang bị hỏng.
      //   KHÔNG dùng 'top': giá trị đó luôn nhảy về đầu trang, tức là xoá đúng
      //   tính năng khôi phục vị trí cuộn mà ta vừa bật.
      // anchorScrolling 'enabled': URL có #fragment thì cuộn tới phần tử đó.
      //   Đây là thứ làm cho skip link trong main-layout.html chạy.
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),

    // 4. withFetch(): dùng Fetch API thay XMLHttpRequest.
    //    Thứ tự interceptor = thứ tự chạy chiều đi. Bước 4 chèn auth và refresh để
    //    mảng thành bản cuối cùng NĂM phần tử:
    //      [loading, lang, auth, error, refresh]
    //    langInterceptor đã có sẵn từ bước 2 và luôn giữ VỊ TRÍ 2 (xem Phần 12).
    provideHttpClient(
      withFetch(),
      withInterceptors([loadingInterceptor, langInterceptor, errorInterceptor]),
    ),
 provideTranslateService({
      fallbackLang: 'en',
      lang: 'en'
    }),


    // 5. Chỗ của provideAppInitializer(() => inject(AuthStore).restoreSession())
    //    ở bước 4. Bước 3 chưa có AuthStore nên chưa có dòng này.

    // 6. Base URL của API (bước 2). Nếu app.config.ts trên máy bạn chưa có dòng
    //    này sau bước 2 thì thêm ngay tại đây, đúng vị trí này.
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },

    // 7. ErrorHandler của bước 2: chuẩn hoá lỗi chưa bắt thành toast + log.
    { provide: ErrorHandler, useClass: GlobalErrorHandler },

    // 8. LOCALE_ID. Đọc lựa chọn ngôn ngữ đã lưu, nhưng ĐỌC ĐÚNG MỘT LẦN: giá trị
    //    này CỐ ĐỊNH suốt phiên và sẽ CŨ ngay sau lần đổi ngôn ngữ đầu tiên.
    //    KHÔNG có gì trong dự án được phép đọc nó (xem Phần 12). Giữ lại chỉ để một
    //    `| date` lọt lưới định dạng theo tiếng Việt thay vì âm thầm theo en-US.
    //    CỐ Ý KHÔNG có registerLocaleData — xem giải thích bên dưới.
    { provide: LOCALE_ID, useFactory: readStoredLang },

    // 9. Ghi đè DefaultTitleStrategy. useClass (không phải useExisting) vì
    //    AppTitleStrategy khai @Injectable() trần, không providedIn: 'root'.
    //    Quy ước của dự án: dòng này luôn nằm SAU provideRouter(...).
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ],
};
