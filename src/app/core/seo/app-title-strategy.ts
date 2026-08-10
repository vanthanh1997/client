import { Injectable, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { LanguageService } from '@core/i18n/language-service';

const BRAND = 'Shop';
const SEPARATOR = ' | ';

@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  private readonly lang = inject(LanguageService);

  private readonly snapshot = signal<RouterStateSnapshot | null>(null);

  constructor() {
    super();
    effect(() => {
      const current = this.snapshot();
      const lang = this.lang.active();
      void lang;

      if (current === null) {
        return;
      }
      const key = this.buildTitle(current);
      this.title.setTitle(key ? `${this.lang.t(key)}${SEPARATOR}${BRAND}` : BRAND);
    });
  }
  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.snapshot.set(snapshot);
  }
}
