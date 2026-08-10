import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="hero min-h-[60vh]">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <p class="text-7xl font-bold opacity-20" aria-hidden="true">403</p>
          <h1 class="mt-2 text-2xl font-bold">Không đủ quyền</h1>
          <div role="alert" class="alert alert-warning alert-soft mt-4 text-left">
            <span>Tài khoản hiện tại không được phép mở trang này.</span>
          </div>
          <p class="mt-4 text-left text-sm opacity-70">
            Quyền được cấp theo vai trò. Nếu bạn cho rằng đây là nhầm lẫn, hãy đăng nhập bằng tài
            khoản khác hoặc liên hệ quản trị viên của cửa hàng.
          </p>

          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <a class="btn btn-ghost" routerLink="/">Về trang chủ</a>
            <a class="btn btn-primary" routerLink="/login">Đăng nhập lại</a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class Forbidden {}
