import { AppLang, CURRENCY_CODE } from '@core/i18n/lang';

/* --------------------------------------------------------------------------
 * HỢP ĐỒNG CHUNG CỦA MỌI HÀM TRONG FILE NÀY — đọc trước khi sửa bất cứ dòng nào
 *
 * 1. Đầu vào null / undefined / '' / '   ' / NaN / Infinity  ->  TRẢ CHUỖI RỖNG.
 *    Trả '' chứ không trả null: kết quả được nối vào aria-label, title, và nội
 *    suy trong template — null sẽ hiện ra chữ "null" trên màn hình.
 *
 * 2. TUYỆT ĐỐI không để Intl nhận Invalid Date hay NaN. Intl.DateTimeFormat.format
 *    ném RangeError với Invalid Date, và RangeError ném từ trong một pipe sẽ giết
 *    cả lượt render — một ô ngày trống biến thành một trang trắng.
 *
 * 3. TUYỆT ĐỐI không biến null thành 0. '0 ₫' là một con số SAI, không phải một ô
 *    trống. Người đọc không phân biệt được "hàng này miễn phí" với "chưa có dữ
 *    liệu", và đó là loại sai mà không ai báo lỗi vì màn hình trông vẫn bình thường.
 * -------------------------------------------------------------------------- */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export type DatePreset = 'date' | 'dateTime' | 'time' | 'dayMonth' | 'full';
export type NumberPreset = 'decimal' | 'integer' | 'compact';
export type MoneyPreset = 'money' | 'moneyCompact';

const DATE_PRESETS: Record<DatePreset, Intl.DateTimeFormatOptions> = {
  date: { day: '2-digit', month: '2-digit', year: 'numeric' },
  dateTime: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
  time: { hour: '2-digit', minute: '2-digit' },
  dayMonth: { day: '2-digit', month: '2-digit' },
  full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
};

const NUMBER_PRESETS: Record<NumberPreset, Intl.NumberFormatOptions> = {
  decimal: { maximumFractionDigits: 2 },
  integer: { maximumFractionDigits: 0 },
  compact: { notation: 'compact', maximumFractionDigits: 1 },
};

/**
 * Dựng Date từ giá trị bất kỳ, GIỮ ĐÚNG ngữ nghĩa của toDate() trong Angular.
 *
 * Điểm sống còn là nhánh DATE_ONLY. `new Date('2026-08-08')` của JavaScript parse
 * chuỗi đó theo **UTC** (quy định trong ECMA-262 cho dạng date-only), rồi hiển thị
 * theo giờ địa phương. Ở múi giờ ÂM, nửa đêm UTC ngày 8 là chiều ngày 7 — nên một
 * ngày sinh, một hạn giao hàng, một ngày lập hoá đơn sẽ hiện LÙI MỘT NGÀY cho toàn
 * bộ người dùng ở châu Mỹ. Ở múi giờ +07:00 lỗi này KHÔNG BAO GIỜ xuất hiện, nên
 * không máy nào trong đội thấy được nó.
 *
 * Chuỗi có phần giờ (kèm 'Z' hoặc offset) thì để `new Date` xử lý bình thường:
 * đó là một THỜI ĐIỂM, và hiển thị nó theo giờ địa phương là đúng.
 */
export function toAppDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? new Date(value) : null;
  }
  if (typeof value !== 'string') {
    return null;
  }

  const text = value.trim();
  if (text === '') {
    return null;
  }

  if (DATE_ONLY.test(text)) {
    const [year, month, day] = text.split('-').map(Number);
    // Nửa đêm ĐỊA PHƯƠNG, không phải UTC.
    const local = new Date(year, month - 1, day);
    return Number.isNaN(local.getTime()) ? null : local;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Ép về số hữu hạn, hoặc null.
 *
 * CỐ Ý từ chối boolean và mảng: Number(true) === 1 và Number([]) === 0 là hai
 * chuyển đổi ngầm của JavaScript sẽ biến một cờ hoặc một mảng rỗng thành số 0
 * trên hoá đơn.
 */
export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const text = value.trim();
    if (text === '') return null;
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function formatDate(locale: string, value: unknown, preset: DatePreset = 'date'): string {
  const date = toAppDate(value);
  if (date === null) return '';
  return new Intl.DateTimeFormat(locale, DATE_PRESETS[preset]).format(date);
}

export function formatNumber(
  locale: string,
  value: unknown,
  preset: NumberPreset = 'decimal',
): string {
  const number = toFiniteNumber(value);
  if (number === null) return '';
  return new Intl.NumberFormat(locale, NUMBER_PRESETS[preset]).format(number);
}

/**
 * Tiền tệ. Luôn VND.
 *
 * currencyDisplay khác nhau theo ngôn ngữ là quyết định đã chốt:
 * - vi: 'symbol'  -> "1.234.567 ₫"     (người Việt đọc ký hiệu ₫ tự nhiên)
 * - en: 'code'    -> "VND 1,234,567"   (mặc định của en-US cho VND là "₫1,234,567",
 *   một chuỗi vừa đặt sai vị trí ký hiệu vừa không cho người nước ngoài biết đây
 *   là tiền gì. Mã ISO nói rõ ràng hơn ký hiệu lạ.)
 */
export function formatMoney(locale: string, value: unknown, preset: MoneyPreset = 'money'): string {
  const number = toFiniteNumber(value);
  if (number === null) return '';

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: CURRENCY_CODE,
    currencyDisplay: locale.startsWith('vi') ? 'symbol' : 'code',
    maximumFractionDigits: preset === 'moneyCompact' ? 1 : 0,
  };
  if (preset === 'moneyCompact') {
    options.notation = 'compact';
  }

  return new Intl.NumberFormat(locale, options).format(number);
}

/**
 * Phần trăm.
 *
 * CHÚ Ý HOA: Intl nhận TỈ LỆ, không nhận số phần trăm.
 *   formatPercent(locale, 0.175) -> "17,5%"
 *   formatPercent(locale, 17.5)  -> "1.750%"
 * Đây là chỗ 100% người dùng hàm này nhầm ở lần đầu. Nếu dữ liệu từ backend là
 * 17.5 thì chia 100 TẠI CHỖ GỌI, đừng sửa hàm này — sửa hàm là làm sai mọi chỗ
 * gọi đúng.
 */
export function formatPercent(locale: string, value: unknown, maxFractionDigits = 1): string {
  const number = toFiniteNumber(value);
  if (number === null) return '';
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: maxFractionDigits,
  }).format(number);
}

const RELATIVE_DIVISIONS: readonly (readonly [number, Intl.RelativeTimeFormatUnit])[] = [
  [60, 'second'],
  [60, 'minute'],
  [24, 'hour'],
  [7, 'day'],
  [4.34524, 'week'],
  [12, 'month'],
  [Number.POSITIVE_INFINITY, 'year'],
];

/**
 * Thời gian tương đối: "hôm qua", "3 giờ trước", "yesterday", "in 2 days".
 *
 * numeric: 'auto' là thứ tạo ra "hôm qua" thay vì "1 ngày trước". Đây là khác biệt
 * giữa một câu người viết và một câu máy sinh.
 *
 * Tham số `now` tồn tại để test không phụ thuộc đồng hồ thật.
 */
export function formatRelativeTime(locale: string, value: unknown, now: Date = new Date()): string {
  const date = toAppDate(value);
  if (date === null) return '';

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  let delta = (date.getTime() - now.getTime()) / 1000;

  for (const [amount, unit] of RELATIVE_DIVISIONS) {
    if (Math.abs(delta) < amount) {
      return formatter.format(Math.round(delta), unit);
    }
    delta /= amount;
  }
  return formatter.format(Math.round(delta), 'year');
}

/** So sánh chuỗi để sắp xếp. `numeric: true` để "Mục 10" đứng sau "Mục 9". */
export function compareStrings(locale: string, a: string, b: string): number {
  return new Intl.Collator(locale, { sensitivity: 'base', numeric: true }).compare(a, b);
}

/** Chọn dạng số nhiều. Xem luật ở mục 10.3. */
export function selectPlural(locale: string, count: number): Intl.LDMLPluralRule {
  return new Intl.PluralRules(locale).select(count);
}

/**
 * Đổi mọi khoảng trắng không ngắt dòng thành khoảng trắng thường.
 *
 * Intl chèn U+00A0 (NO-BREAK SPACE) giữa số và ký hiệu tiền tệ, và một số phiên bản
 * ICU dùng U+202F (NARROW NO-BREAK SPACE). Trên màn hình chúng trông y hệt dấu cách.
 *
 * KHÔNG gọi hàm này bên trong formatMoney: NO-BREAK SPACE là ĐÚNG về mặt trình bày,
 * nó ngăn "1.234.567" và "₫" bị tách ra hai dòng khi cột hẹp — đúng thứ ta cần ở
 * bề rộng 360px. Hàm này dành cho hai chỗ: (1) so sánh trong test, (2) chuỗi đem đi
 * sao chép hoặc ghép vào aria-label, nơi ký tự lạ gây phiền hơn là giúp.
 */
export function normalizeSpaces(text: string): string {
  return text.replace(/[  ]/g, ' ');
}

/** Khoá cache nếu sau này ĐO ĐƯỢC là cần. Xem giải thích bên dưới trước khi dùng. */
export function intlKey(locale: string, preset: string, currency?: AppLang | string): string {
  return `${locale}|${preset}|${currency ?? ''}`;
}
