import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { TranslatePipe } from '@ngx-translate/core';
import { LoadingService } from "@core/services/loading-service";
@Component({
  selector: 'app-top-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    @if (loading.isLoading()) {
      <progress
        class="progress progress-primary fixed inset-x-0 top-0 z-[1200] h-1 rounded-none"
        [attr.aria-label]="'common.loading' | translate"
      ></progress>
    }
  `,
})
export class TopProgressBar{
    protected readonly loading = inject(LoadingService);
}