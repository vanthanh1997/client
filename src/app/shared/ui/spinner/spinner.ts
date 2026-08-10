import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';


export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SPINNER_SIZE_CLASS: Readonly<Record<SpinnerSize, string>> = {
  xs: 'loading-xs',
  sm: 'loading-sm',
  md: 'loading-md',
  lg: 'loading-lg',
  xl: 'loading-xl',
};

@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <span
      class="loading loading-spinner"
      [class]="sizeClass()"
      role="status"
      [attr.aria-label]="labelKey() | translate"
    ></span>
  `,
})
export class Spinner {
  readonly size = input<SpinnerSize>('md');
  readonly labelKey = input('common.loading');
  protected readonly sizeClass = computed(
    () => SPINNER_SIZE_CLASS[this.size()] ?? SPINNER_SIZE_CLASS.md,
  );
}
