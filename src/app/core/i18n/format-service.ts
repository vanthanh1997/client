import { Injectable, inject } from '@angular/core';

import {
  DatePreset,
  MoneyPreset,
  NumberPreset,
  compareStrings,
  formatDate,
  formatMoney,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  selectPlural,
} from '@core/i18n/format';
import { LanguageService } from '@core/i18n/language-service';

/**
 * API định dạng cho TypeScript.
 *
 * Service này tồn tại để LẤP MỘT LỖ HỔNG, không phải để cho tiện: nếu chỉ cấm
 * `| date` trong template mà không mở đường trong TypeScript, người viết một
 * computed() cần chuỗi ngày sẽ gọi formatDate() của @angular/common — và ăn đúng
 * LOCALE_ID cũ mà cả phần 12 này đang tránh. Cấm mà không mở đường là đặt bẫy.
 *
 * Mọi hàm ở đây ĐỌC SIGNAL intlLocale(), nên gọi chúng trong computed() hoặc
 * trong template sẽ tự phản ứng khi đổi ngôn ngữ.
 */
@Injectable({ providedIn: 'root' })
export class FormatService {
  private readonly lang = inject(LanguageService);

  date(value: unknown, preset: DatePreset = 'date'): string {
    return formatDate(this.lang.intlLocale(), value, preset);
  }

  number(value: unknown, preset: NumberPreset = 'decimal'): string {
    return formatNumber(this.lang.intlLocale(), value, preset);
  }

  money(value: unknown, preset: MoneyPreset = 'money'): string {
    return formatMoney(this.lang.intlLocale(), value, preset);
  }

  /** Nhận TỈ LỆ (0.175 = 17,5%), không nhận 17.5. */
  percent(value: unknown, maxFractionDigits = 1): string {
    return formatPercent(this.lang.intlLocale(), value, maxFractionDigits);
  }

  relative(value: unknown, now?: Date): string {
    return formatRelativeTime(this.lang.intlLocale(), value, now);
  }

  /** Dùng trong .sort((a, b) => format.compare(a.name, b.name)). */
  compare(a: string, b: string): number {
    return compareStrings(this.lang.intlLocale(), a, b);
  }

  /**
   * Chọn hậu tố khoá số nhiều: 'one' | 'other' | ... (xem mục 10.3).
   * ngx-translate 18 KHÔNG có ICU plural, nên đây là cách duy nhất không sinh ra
   * câu "Cart (1 items)".
   */
  plural(count: number): Intl.LDMLPluralRule {
    return selectPlural(this.lang.intlLocale(), count);
  }
}
