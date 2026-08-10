import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, timeout } from 'rxjs';

import { BOOTSTRAP_MESSAGES } from '@core/i18n/bootstrap-messages';
import {
  AppLang,
  BOOT_TIMEOUT_MS,
  INTL_LOCALES,
  TranslateFn,
} from '@core/i18n/lang';
import {
  applyDocumentLang,
  onExternalLangChange,
  readStoredLang,
  writeStoredLang,
} from '@core/i18n/locale-storage';
import { environment } from '@env/environment';

/**
 * Giá trị dịch dùng được hay không.
 *
 * Loại `key` (ngx-translate trả lại chính khoá khi không tìm thấy) và loại chuỗi
 * RỖNG: công cụ dịch xuất khoá chưa dịch dưới dạng "" chứ không xoá khoá đi, và
 * một toast trống tệ hơn một toast tiếng Việt.
 */
const isUsable = (value: unknown, key: string): value is string =>
  typeof value === 'string' && value.trim() !== '' && value !== key;

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Ngôn ngữ đang hiển thị. Khởi tạo ĐỒNG BỘ ngay trong field initializer từ
   * localStorage — không chờ load(), vì FormatService và 5 pipe có thể được đọc
   * ở lượt render đầu tiên, trước khi initializer chạy xong.
   */
  readonly active = signal<AppLang>(readStoredLang());

  /** Locale truyền cho Intl. Đây là signal mà 5 pipe và FormatService đọc. */
  readonly intlLocale = computed(() => INTL_LOCALES[this.active()]);

  /**
   * Ba trạng thái, KHÔNG phải một cờ boolean.
   *
   * Một `ready = signal(false)` mà không chỗ nào set(true) nghĩa là banner "không
   * tải được bản dịch" hiện cho 100% người dùng ở 100% lần tải. Và ở nhánh hết
   * ngân sách, cờ boolean kẹt vĩnh viễn dù bản dịch đã về ở giây thứ 5 và giao
   * diện đã đúng chữ.
   */
  readonly i18nState = signal<'loading' | 'ok' | 'failed'>('loading');

  /**
   * Đường dịch DUY NHẤT cho TypeScript. Ba bước, đúng thứ tự này:
   *
   * (1) TỦ DỰ PHÒNG của NGÔN NGỮ ĐANG CHỌN, phủ đúng BOOTSTRAP_KEYS.
   *     Thắng instant() là CỐ Ý và là điểm dễ đảo ngược nhất khi refactor:
   *     instant() đã trộn sẵn fallbackLang='vi', nên nếu để nó chạy trước thì
   *     người dùng EN sẽ nhận câu TIẾNG VIỆT trong khi câu tiếng Anh đúng đang
   *     nằm sẵn trong bundle của họ.
   *     Tủ được SINH RA từ chính vi.json/en.json nên không thể lệch câu chữ, và
   *     nó nằm trong bundle có content-hash nên không thể là bản cũ trong cache.
   *
   * (2) Bản dịch đã nạp. instant() đã bao gồm fallbackLang='vi'.
   *
   * (3) Trả lại chính khoá, và ồn ào ở môi trường dev.
   */
  readonly t: TranslateFn = (key, params) => {
    const fallback = BOOTSTRAP_MESSAGES[this.active()][key];
    if (fallback !== undefined) {
      return fallback;
    }

    const value: unknown = this.translate.instant(key, params);
    if (isUsable(value, key)) {
      return value;
    }

    if (!environment.production) {
      console.warn('[i18n] khoá không dịch được:', key);
    }
    return key;
  };

  /**
   * Chạy một lần trong provideAppInitializer. KHÔNG BAO GIỜ reject: một
   * initializer reject sẽ chặn bootstrap và cho ra trang trắng — hỏng bản dịch
   * không được phép làm hỏng cả ứng dụng.
   */
  async load(): Promise<void> {
    const lang = this.active();

    // DÒNG ĐẦU TIÊN, TRƯỚC MỌI await.
    // Nếu đặt sau await, thẻ <html> giữ lang="vi" trong suốt thời gian tải JSON
    // (tới 4 giây ở mạng chậm). Trình đọc màn hình bắt đầu đọc NGAY khi có DOM,
    // nên nó sẽ đọc trang tiếng Anh bằng giọng tiếng Việt trong đúng khoảng đó.
    applyDocumentLang(lang);

    // Hai tab không được lệch ngôn ngữ. Đăng ký ở đây chứ không ở constructor:
    // giữ chuỗi khởi tạo DI ngắn và không có hiệu ứng phụ lúc dựng service.
    this.destroyRef.onDestroy(
      onExternalLangChange((next) => {
        // persist=false: tab kia đã ghi rồi, ghi lại là dư thừa và có thể sinh
        // vòng sự kiện giữa các tab.
        void this.switchTo(next, false);
      }),
    );

    // Bản dịch về MUỘN (sau khi đã hết ngân sách) vẫn được ngx-translate áp vào
    // giao diện. Phải gỡ banner, nếu không người dùng thấy chữ đúng kèm một dòng
    // báo lỗi không bao giờ tắt.
    this.translate.onLangChange.subscribe(() => this.i18nState.set('ok'));

    try {
      await firstValueFrom(this.translate.use(lang).pipe(timeout(BOOT_TIMEOUT_MS)));
      this.i18nState.set('ok');
    } catch (error) {
      // Loader (mục 8.1) đã in một dòng [i18n] phân loại cho mọi lỗi mạng.
      // Ở đây chỉ in thêm khi lỗi là hết NGÂN SÁCH KHỞI ĐỘNG, để console luôn
      // có đúng một dòng [i18n] cho một sự cố.
      if ((error as Error | undefined)?.name === 'TimeoutError') {
        console.error(`[i18n] hết ngân sách khởi động ${BOOT_TIMEOUT_MS}ms cho '${lang}'`);
      }
      this.i18nState.set('failed');
    }
  }

  /**
   * Đổi ngôn ngữ TỨC THÌ. Không tải lại trang.
   *
   * Thứ tự bốn bước là bắt buộc:
   *   1. tải bản dịch mới và CHỜ nó xong;
   *   2. chỉ khi thành công mới đổi signal `active` — mọi pipe và FormatService
   *      đọc signal này nên bước 2 là khoảnh khắc giao diện đổi;
   *   3. đổi thuộc tính lang của <html>;
   *   4. ghi localStorage SAU CÙNG.
   *
   * Nếu đổi signal TRƯỚC khi tải xong, sẽ có một khoảng vài trăm mili giây mà số
   * và ngày đã theo ngôn ngữ mới còn chữ vẫn theo ngôn ngữ cũ. Nếu ghi storage
   * trước khi tải xong, một lần tải hỏng sẽ khiến F5 tiếp theo mở ra một ngôn ngữ
   * mà máy này chưa bao giờ tải được.
   */
  async switchTo(lang: AppLang, persist = true): Promise<boolean> {
    if (lang === this.active()) {
      return true;
    }

    try {
      await firstValueFrom(this.translate.use(lang).pipe(timeout(BOOT_TIMEOUT_MS)));
    } catch {
      // Giữ nguyên ngôn ngữ cũ. Không ghi storage. Không đổi signal.
      // Nơi gọi (nút đổi ngôn ngữ) đọc giá trị trả về để bắn toast.
      return false;
    }

    this.active.set(lang);
    applyDocumentLang(lang);
    if (persist) {
      writeStoredLang(lang);
    }
    this.i18nState.set('ok');
    return true;
  }
}
