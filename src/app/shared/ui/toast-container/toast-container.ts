import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastKind, ToastService } from '@core/services/toast-service';

const TOAST_ALERT_CLASS: Readonly<Record<ToastKind, string>> = {
  success: 'alert-success',
  error: 'alert-error',
  info: 'alert-info',
};

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  templateUrl: 'toast-container.html',
})
export class ToastContainer {
  protected readonly toast = inject(ToastService);

  protected alertClass(kind: ToastKind): string {
    return TOAST_ALERT_CLASS[kind];
  }

  protected isUrgent(kind: ToastKind): boolean {
    return kind === 'error';
  }
}
