import { Injectable, effect, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { LanguageService } from '@core/i18n/language-service';

/**
 * Đồng bộ <title> và <meta name="description"> theo ngôn ngữ đang chọn.
 *
 * index.html chỉ chứa được MỘT ngôn ngữ (tiếng Việt — DEFAULT_LANG). Đó là thứ hiện
 * trên tab trình duyệt trong lúc bundle còn đang tải, nên hai thẻ tĩnh ở đó phải giữ
 * nguyên và phải TRÙNG câu chữ với khoá `meta.*` của vi.json.
 *
 * Service là `providedIn: 'root'` nên LƯỜI: phải có nơi inject nó (App) thì effect
 * dưới đây mới chạy.
 */
@Injectable({ providedIn: 'root' })
export class DocumentMeta {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly lang = inject(LanguageService);

  /**
   * CHỜ i18nState === 'ok' rồi mới ghi.
   *
   * Ghi sớm hơn thì bảng dịch chưa về, t() trả lại CHÍNH KHOÁ, và tab trình duyệt
   * hiện đúng chữ "meta.title" — công cụ tìm kiếm có thể chụp ngay khoảnh khắc đó.
   * Giữ thẻ tĩnh của index.html luôn tốt hơn một khoá lộ ra ngoài.
   */
  private readonly sync = effect(() => {
    if (this.lang.i18nState() !== 'ok') {
      return;
    }

    // Đọc signal để effect chạy lại mỗi lần đổi ngôn ngữ. t() KHÔNG phải signal nên
    // nếu bỏ dòng này, tiêu đề sẽ đứng yên ở ngôn ngữ đầu tiên.
    this.lang.active();

    this.title.setTitle(this.lang.t('meta.title'));
    this.meta.updateTag({ name: 'description', content: this.lang.t('meta.description') });
  });
}
