import { EnvironmentProviders, Provider } from '@angular/core';
import {
  TranslateLoader,
  TranslateService,
  TranslationObject,
  provideTranslateService,
} from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { AppLang, DEFAULT_LANG } from '@core/i18n/lang';

/**
 * Loader trả bản dịch từ bộ nhớ, đồng bộ. Không HttpClient, không HttpBackend.
 *
 * Kiểu trả về là TranslationObject chứ không phải `object`: TranslateLoader khai
 * `Observable<TranslationObject>`, và một phương thức cài đặt trả kiểu RỘNG HƠN
 * kiểu đã khai là lỗi biên dịch.
 */
class StaticTestLoader implements TranslateLoader {
  constructor(private readonly tables: Partial<Record<AppLang, TranslationObject>>) {}

  getTranslation(lang: string): Observable<TranslationObject> {
    return of(this.tables[lang as AppLang] ?? {});
  }
}

/**
 * Provider i18n cho TestBed.
 *
 * @param lang   ngôn ngữ khởi tạo
 * @param tables bản dịch theo ngôn ngữ; thiếu ngôn ngữ nào thì ngôn ngữ đó rỗng —
 *               CỐ Ý, vì "bảng rỗng" là ca cần test nhiều nhất.
 */
export function provideTestI18n(
  lang: AppLang = DEFAULT_LANG,
  tables: Partial<Record<AppLang, TranslationObject>> = {},
): (Provider | EnvironmentProviders)[] {
  return [
    provideTranslateService({
      lang,
      fallbackLang: DEFAULT_LANG,
      loader: { provide: TranslateLoader, useFactory: () => new StaticTestLoader(tables) },
    }),
  ];
}

/** Đổi ngôn ngữ trong test mà không đi qua LanguageService (dùng cho test của pipe). */
export function useTestLang(translate: TranslateService, lang: AppLang): void {
  translate.use(lang);
}
