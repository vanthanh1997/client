/**
 * Khuôn chung cho mọi environment. Có file này thì khi bạn thêm một key
 * vào environment.ts mà quên thêm vào environment.development.ts,
 * TypeScript báo lỗi ngay lúc build thay vì để app chết lúc chạy.
 */
export interface AppEnvironment {
  /** true khi build production — dùng để tắt log, bật tối ưu. */
  readonly production: boolean;

  /**
   * Tiền tố cho mọi lời gọi API. Cố ý để đường dẫn TƯƠNG ĐỐI ở cả hai môi trường:
   * - dev  : proxy.conf.json chuyển /api sang http://localhost:5037
   * - prod : nginx reverse proxy /api sang container API
   * Nhờ vậy request luôn cùng origin => không bao giờ dính CORS,
   * và URL thật của backend không bị nhúng vào bundle gửi cho trình duyệt.
   */
  readonly apiBaseUrl: string;

  /** Client ID của Google Sign-In. Để rỗng thì nút đăng nhập Google tự ẩn. */
  readonly googleClientId: string;
}
