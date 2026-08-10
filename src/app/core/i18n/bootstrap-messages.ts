import data from '@core/i18n/bootstrap-messages.json';
import { AppLang } from '@core/i18n/lang';

/**
 * Từ điển dự phòng nằm TRONG bundle, phủ đúng BOOTSTRAP_KEYS.
 *
 * SINH TỰ ĐỘNG bởi tools/gen-bootstrap.mjs — CẤM SỬA TAY file .json.
 * Muốn đổi câu chữ: sửa public/i18n/*.json rồi chạy `npm run i18n:gen`.
 *
 * Chiều thẩm quyền: public/i18n/*.json là NGUỒN SỰ THẬT; file .json ở đây là SẢN
 * PHẨM SINH. CI đỏ ở `--check` thì chạy lại generator và commit — không bao giờ
 * sửa tay file sinh, và tuyệt đối không sửa JSON nguồn cho khớp file sinh.
 */
export const BOOTSTRAP_MESSAGES = data as Record<AppLang, Readonly<Record<string, string>>>;
