import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="hero min-h-[60vh]">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <p class="text-7xl font-bold opacity-20" aria-hidden="true">404</p>

          <h1 class="mt-2 text-2xl font-bold">Không tìm thấy trang</h1>

          <!-- role="status" (polite): đây là thông tin, không phải sự cố cần cắt ngang. -->
          <div role="status" class="alert alert-info alert-soft mt-4 text-left">
            <span>
              Đường dẫn bạn mở không tồn tại, đã bị đổi tên, hoặc bạn gõ nhầm một ký tự.
            </span>
          </div>

          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <a class="btn btn-primary" routerLink="/">Về trang chủ</a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class NotFound {}
