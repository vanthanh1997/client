import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { AppLang, LANG_LABELS, LANG_SHORT_LABELS, SUPPORTED_LANGS } from '@core/i18n/lang';
import { LanguageService } from '@core/i18n/language-service';
import { ToastService } from '@core/services/toast-service';

@Component({
  selector: 'app-language-switch',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details class="dropdown dropdown-end" [open]="open()" (toggle)="onToggle($event)">
      <summary
        class="btn btn-ghost btn-sm min-w-12"
        [attr.aria-label]="'common.language' | translate"
      >
        {{ shortLabel() }}
      </summary>
      <ul class="menu dropdown-content z-10 mt-1 w-44 rounded-box bg-base-100 p-2 shadow">
        @for (item of langs; track item) {
          <li>
            <button
              type="button"
              [class.menu-active]="item === lang.active()"
              [attr.aria-current]="item === lang.active() ? 'true' : null"
              [disabled]="busy()"
              (click)="choose(item)"
            >
              {{ labels[item] }}
            </button>
          </li>
        }
      </ul>
    </details>
  `,
})
export class LanguageSwitch {
  protected readonly lang = inject(LanguageService);
  private readonly toast = inject(ToastService);

  protected readonly langs = SUPPORTED_LANGS;
  protected readonly labels = LANG_LABELS;
  protected readonly open = signal(false);
  protected readonly busy = signal(false);

  protected shortLabel(): string {
    return LANG_SHORT_LABELS[this.lang.active()];
  }

  protected onToggle(event: Event): void {
    this.open.set((event.target as HTMLDetailsElement).open);
  }

  protected async choose(next: AppLang): Promise<void> {
    this.open.set(false);
    this.busy.set(true);
    try {
      const ok = await this.lang.switchTo(next);
      if (!ok) {
        this.toast.error(this.lang.t('toast.langSwitchFailed'));
      }
    } finally {
      this.busy.set(false);
    }
  }
}
