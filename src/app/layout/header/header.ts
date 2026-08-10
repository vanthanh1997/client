import { BreakpointObserver } from "@angular/cdk/layout";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { TranslatePipe } from "@ngx-translate/core";
import { LanguageSwitch } from "@shared/ui/language-switch";
import { map } from "rxjs";

export interface NavItem {
  readonly path: string;       // Đường dẫn route (ví dụ: '/')
  readonly labelKey: string;   // KHÓA DỊCH i18n (ví dụ: 'nav.home'), KHÔNG gán cứng tiếng Việt!
  readonly exact: boolean;     // Khớp chính xác URL hay không
}
const NAV_ITEMS: readonly NavItem[] = [{ path: '/', labelKey: 'nav.home', exact: true }];
const MOBILE_QUERY = '(max-width: 1023.98px)';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TranslatePipe, LanguageSwitch],
  templateUrl: './header.html',
})
export class Header {
  private readonly breakpoints = inject(BreakpointObserver);
  protected readonly navItems = NAV_ITEMS;
  protected readonly isMobile = toSignal(
    this.breakpoints.observe(MOBILE_QUERY).pipe(map((state) => state.matches)),
    { initialValue: this.breakpoints.isMatched(MOBILE_QUERY) },
  );
}