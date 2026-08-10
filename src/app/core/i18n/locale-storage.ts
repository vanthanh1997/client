import { AppLang, DEFAULT_LANG, LANG_STORAGE_KEY, isAppLang } from '@core/i18n/lang';

/**
 * Bản sao trong bộ nhớ, CẤP MODULE.
 *
 * Chỉ được dùng khi localStorage không ghi được (Safari duyệt riêng tư, tab chặn
 * cookie bên thứ ba, chính sách doanh nghiệp). Khi đó ngôn ngữ sống trong tab hiện
 * tại và mất khi F5 — đúng ba mất mát mà TokenStorage đã chấp nhận cho token, nên
 * hành vi ứng dụng nhất quán.
 */
let memoryLang: AppLang | null = null;

/** null = chưa dò. Dò đúng một lần cho mỗi lần tải trang. */
let storageWritable: boolean | null = null;

/**
 * Dò bằng cách GHI THẬT rồi xoá.
 *
 * `typeof localStorage !== 'undefined'` KHÔNG đủ: ở Safari duyệt riêng tư đối tượng
 * vẫn tồn tại và getItem vẫn chạy, chỉ setItem mới ném QuotaExceededError. Dò bằng
 * cách đọc cũng không đủ vì lý do y hệt.
 */
function probeStorage(): boolean {
  try {
    const probeKey = `${LANG_STORAGE_KEY}.probe`;
    localStorage.setItem(probeKey, '1');
    localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

function isWritable(): boolean {
  if (storageWritable === null) {
    storageWritable = probeStorage();
  }
  return storageWritable;
}

/**
 * Đọc ngôn ngữ đã lưu. THUẦN, ĐỒNG BỘ, KHÔNG BAO GIỜ NÉM.
 *
 * Ba tính chất đó là bắt buộc, không phải để cho đẹp: hàm này được gọi trong
 * `provideTranslateService({ lang: readStoredLang() })` và trong factory của
 * LOCALE_ID — tức là lúc đang DỰNG injector, nơi không có ErrorHandler nào bắt
 * lỗi và một exception sẽ làm trắng trang.
 *
 * CỐ Ý đọc thẳng localStorage mỗi lần thay vì cache: sự kiện `storage` từ tab
 * khác phải đọc ra giá trị mới, mà một cache cấp module sẽ nuốt mất.
 */
export function readStoredLang(): AppLang {
  if (isWritable()) {
    try {
      const raw = localStorage.getItem(LANG_STORAGE_KEY);
      return isAppLang(raw) ? raw : DEFAULT_LANG;
    } catch {
      storageWritable = false;
    }
  }
  return memoryLang ?? DEFAULT_LANG;
}

/** Ghi lựa chọn. Luôn cập nhật bản trong bộ nhớ trước, rồi mới thử ghi đĩa. */
export function writeStoredLang(lang: AppLang): void {
  memoryLang = lang;

  if (!isWritable()) {
    return;
  }
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Hết quota giữa chừng: hạ cấp sang bộ nhớ, không ném lên trên.
    storageWritable = false;
  }
}

/**
 * Đặt thuộc tính `lang` của thẻ <html>.
 *
 * Đây KHÔNG phải việc trang trí. Thuộc tính này quyết định:
 * - trình đọc màn hình chọn giọng đọc nào (đọc tiếng Việt bằng giọng Anh là
 *   không nghe được, không phải "hơi khó nghe");
 * - trình duyệt chọn bộ từ điển kiểm chính tả nào cho <textarea>;
 * - CSS `:lang()` và quy tắc ngắt dòng theo ngôn ngữ.
 *
 * Dùng setAttribute chứ không gán `document.documentElement.lang = ...`: hai cách
 * tương đương ở đây, nhưng setAttribute là thứ hiện ra khi soi DOM, nên nghiệm thu
 * bằng mắt khớp với code.
 */
export function applyDocumentLang(lang: AppLang): void {
  try {
    document.documentElement.setAttribute('lang', lang);
  } catch {
    // Môi trường không có DOM (một số cấu hình test). Không có gì để làm.
  }
}

/**
 * Nghe thay đổi ngôn ngữ do TAB KHÁC gây ra.
 *
 * Sự kiện `storage` chỉ bắn ở các tab KHÁC tab đã ghi — đúng thứ cần: tab vừa bấm
 * nút đã tự cập nhật rồi, các tab còn lại cần được báo.
 *
 * Trả về hàm gỡ đăng ký, để nơi gọi tự dọn (DestroyRef).
 */
export function onExternalLangChange(handler: (lang: AppLang) => void): () => void {
  const listener = (event: StorageEvent): void => {
    // event.key === null khi localStorage.clear(). Cũng phải xử lý.
    if (event.key !== null && event.key !== LANG_STORAGE_KEY) {
      return;
    }
    handler(readStoredLang());
  };

  window.addEventListener('storage', listener);
  return () => window.removeEventListener('storage', listener);
}
