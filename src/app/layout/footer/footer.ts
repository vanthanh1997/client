import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe],
  template: `
    <footer class="bg-base-200 text-base-content">
      <div class="footer sm:footer-horizontal mx-auto max-w-5xl p-10">
        <aside>
          <p class="text-lg font-bold">Shop</p>
          <p class="max-w-xs text-sm opacity-70">{{ 'footer.tagline' | translate }}</p>
        </aside>

        <nav [attr.aria-label]="'footer.shopLinks' | translate">
          <h2 class="footer-title">{{ 'footer.shop' | translate }}</h2>
          <a class="link link-hover" routerLink="/">{{ 'nav.home' | translate }}</a>
        </nav>

        <nav [attr.aria-label]="'footer.accountLinks' | translate">
          <h2 class="footer-title">{{ 'footer.account' | translate }}</h2>
          <a class="link link-hover" routerLink="/login">{{ 'auth.login' | translate }}</a>
          <a class="link link-hover" routerLink="/register">{{ 'auth.register' | translate }}</a>
        </nav>

        <nav [attr.aria-label]="'footer.supportLinks' | translate">
          <h2 class="footer-title">{{ 'footer.support' | translate }}</h2>
          <a class="link link-hover" href="mailto:support@shop.local">support@shop.local</a>
        </nav>
      </div>

      <div class="mx-auto max-w-5xl px-10">
        <div class="divider my-0" aria-hidden="true"></div>
      </div>

      <div class="footer footer-center p-4 text-sm opacity-70">
        <p>{{ 'footer.copyright' | translate: { year: year } }}</p>
      </div>
    </footer>
  `,
})
export class Footer {
  protected readonly year = new Date().getFullYear();
}
