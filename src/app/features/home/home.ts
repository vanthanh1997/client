import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="hero bg-base-200 min-h-[60vh]">
      <div class="hero-content flex-col gap-6 text-center">
        <div class="max-w-2xl">
          <h1 class="text-4xl font-bold sm:text-5xl">Shop</h1>
          <p class="text-base-content/70 py-6">
            Cửa hàng đang trong giai đoạn dựng khung. Phần tài khoản đã sẵn sàng để bạn đăng ký,
            đăng nhập và quản lý mật khẩu. Danh mục sản phẩm sẽ lên sau.
          </p>
        </div>

        <div class="flex flex-wrap justify-center gap-3">
          <a class="btn btn-primary" routerLink="/register">Tạo tài khoản</a>
          <a class="btn btn-ghost" routerLink="/login">Đăng nhập</a>
        </div>
      </div>
    </section>

    <section class="mx-auto grid max-w-5xl gap-4 p-6 sm:grid-cols-3">
      <div class="card card-border bg-base-100">
        <div class="card-body">
          <h2 class="card-title text-base">Đăng ký bằng email</h2>
          <p class="text-sm opacity-70">
            Tạo tài khoản với email và mật khẩu tối thiểu 8 ký tự, hoặc đăng nhập bằng Google.
          </p>
        </div>
      </div>

      <div class="card card-border bg-base-100">
        <div class="card-body">
          <h2 class="card-title text-base">Xác nhận email</h2>
          <p class="text-sm opacity-70">
            Hệ thống gửi thư xác nhận sau khi đăng ký. Bấm liên kết trong thư là kích hoạt xong.
          </p>
        </div>
      </div>

      <div class="card card-border bg-base-100">
        <div class="card-body">
          <h2 class="card-title text-base">Quên mật khẩu</h2>
          <p class="text-sm opacity-70">
            Đặt lại mật khẩu qua liên kết gửi tới email, không cần liên hệ hỗ trợ.
          </p>
        </div>
      </div>
    </section>
  `,
})
export class Home {}
