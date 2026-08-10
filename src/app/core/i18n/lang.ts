/** Danh sách ngôn ngữ được hỗ trợ. Thứ tự ở đây là thứ tự hiện trên nút đổi ngôn ngữ. */
export const SUPPORTED_LANGS = ['vi', 'en'] as const;

export type AppLang = (typeof SUPPORTED_LANGS)[number];

/** Ngôn ngữ khi chưa biết gì về người dùng, và cũng là fallbackLang của ngx-translate. */
export const DEFAULT_LANG: AppLang = 'vi';

/** Khoá localStorage. Đổi khoá này là làm mọi người dùng cũ mất lựa chọn của họ. */
export const LANG_STORAGE_KEY = 'shop.lang';

/** Nhãn đầy đủ, dùng trong danh sách chọn. Mỗi ngôn ngữ viết bằng CHÍNH NÓ. */
export const LANG_LABELS: Record<AppLang, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
};

/** Nhãn ngắn hai chữ cái, dùng trên nút ở header (chỗ chật). */
export const LANG_SHORT_LABELS: Record<AppLang, string> = {
  vi: 'VI',
  en: 'EN',
};

/**
 * Locale truyền cho Intl.
 *
 * KHÔNG truyền thẳng 'vi'/'en' cho Intl. BCP-47 cho phép cả hai, nhưng 'en' trần
 * để engine tự chọn vùng: một số môi trường ra 'en-GB' (ngày dd/mm), một số ra
 * 'en-US' (ngày mm/dd). Ghim vùng để định dạng giống nhau trên mọi máy.
 */
export const INTL_LOCALES: Record<AppLang, string> = {
  vi: 'vi-VN',
  en: 'en-US',
};

/** Giá trị header Accept-Language gửi lên API. */
export const ACCEPT_LANGUAGE: Record<AppLang, string> = {
  vi: 'vi-VN,vi;q=0.9',
  en: 'en-US,en;q=0.9',
};

/** Đơn vị tiền tệ duy nhất của hệ thống. Đổi ngôn ngữ KHÔNG đổi đơn vị tiền. */
export const CURRENCY_CODE = 'VND';

/** Ngân sách thời gian của tầng i18n. Ba số này bị ràng buộc bởi i18n-budget.spec.ts. */
export const LOADER_TIMEOUT_MS = 1500;
export const LOADER_RETRY_DELAY_MS = 400;
export const BOOT_TIMEOUT_MS = 4000;

/** Đường dẫn file dịch. Trùng với block nginx ở mục 11 và với glob asset của angular.json. */
export const I18N_PREFIX = '/i18n/';
export const I18N_SUFFIX = '.json';

/** Type guard cho giá trị đọc từ localStorage / URL / bất kỳ nguồn không tin cậy nào. */
export function isAppLang(value: unknown): value is AppLang {
  return typeof value === 'string' && (SUPPORTED_LANGS as readonly string[]).includes(value);
}

/**
 * Chữ ký của hàm dịch mà phần còn lại của ứng dụng được phép biết.
 *
 * Đây là LỚP CÁCH LY khỏi ngx-translate: api-client.ts và error-interceptor.ts
 * nhận `TranslateFn`, không nhận `TranslateService`. Nhờ vậy test của chúng chỉ
 * cần truyền `(key) => key` thay vì dựng cả máy dịch, và ngày nào đổi thư viện
 * thì chỉ core/i18n phải sửa.
 */
export type TranslateFn = (key: string, params?: Record<string, unknown>) => string;
