/**
 * Nhóm khoá "dự phòng khởi động".
 *
 * Đây là danh sách duy nhất mà tools/gen-bootstrap.mjs và ba luật CI cùng đọc.
 * File này CỐ Ý không import gì và CỐ Ý không chứa giá trị: nó phải parse được
 * bằng regex trên Node 20 thuần (dự án không có tsx/ts-node/jiti).
 *
 * LUẬT: mọi khoá ở đây BỊ CẤM có tham số nội suy {{...}} — xem giải thích ở
 * language-service.ts, hàm t(), bước (1).
 */
export const BOOTSTRAP_KEYS = [
  'errors.network',
  'errors.timeout',
  'errors.badRequest',
  'errors.unauthorized',
  'errors.forbidden',
  'errors.notFound',
  'errors.conflict',
  'errors.tooManyRequests',
  'errors.serverError',
  'errors.requestFailed',
  'errors.unexpected',
] as const;

export type BootstrapKey = (typeof BOOTSTRAP_KEYS)[number];
