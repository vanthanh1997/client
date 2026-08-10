#!/usr/bin/env node
// tools/gen-bootstrap.mjs
//
// SINH src/app/core/i18n/bootstrap-messages.json từ public/i18n/{vi,en}.json,
// lọc theo danh sách trong src/app/core/i18n/bootstrap-keys.ts.
//
// Cách chạy:
//   node tools/gen-bootstrap.mjs            -> ghi file
//   node tools/gen-bootstrap.mjs --check    -> chỉ so sánh, exit 1 nếu lệch (dùng trong lint/CI)
//
// Node 20 thuần, không phụ thuộc gói nào.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LANGS = ['vi', 'en'];
const KEYS_FILE = resolve(ROOT, 'src/app/core/i18n/bootstrap-keys.ts');
const OUT_FILE = resolve(ROOT, 'src/app/core/i18n/bootstrap-messages.json');

const fail = (message) => {
  console.error(`[gen-bootstrap] ${message}`);
  process.exit(1);
};

/**
 * Đọc BOOTSTRAP_KEYS bằng regex. An toàn vì bootstrap-keys.ts CỐ Ý chỉ chứa
 * literal khoá dạng 'a.b', không chứa câu chữ có dấu nháy.
 */
function readKeys() {
  const src = readFileSync(KEYS_FILE, 'utf8');
  const block = /BOOTSTRAP_KEYS\s*=\s*\[([\s\S]*?)\]\s*as const/.exec(src);
  if (block === null) fail('không tìm thấy mảng BOOTSTRAP_KEYS trong bootstrap-keys.ts');

  const keys = [...block[1].matchAll(/'([A-Za-z0-9_.]+)'/g)].map((m) => m[1]);
  if (keys.length === 0) fail('BOOTSTRAP_KEYS rỗng');
  return keys;
}

/** Tra một khoá phẳng dạng 'errors.network' trong cây JSON lồng nhau. */
function lookup(tree, key) {
  let node = tree;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null || !(part in node)) return undefined;
    node = node[part];
  }
  return node;
}

function readLangFile(lang) {
  const file = resolve(ROOT, `public/i18n/${lang}.json`);
  if (!existsSync(file)) fail(`thiếu ${file}`);

  const raw = readFileSync(file);
  // BOM làm JSON.parse ném ở Node và làm HttpClient ném SyntaxError trên trình duyệt.
  // TỪ CHỐI chứ không tự strip: strip ở đây thì file hỏng vẫn lên production.
  if (raw[0] === 0xef) fail(`public/i18n/${lang}.json có BOM — lưu lại bằng UTF-8 không BOM`);

  try {
    return JSON.parse(raw.toString('utf8'));
  } catch (error) {
    return fail(`public/i18n/${lang}.json không parse được: ${error.message}`);
  }
}

const keys = readKeys();
const result = {};

for (const lang of LANGS) {
  const tree = readLangFile(lang);
  const bucket = {};

  for (const key of keys) {
    const value = lookup(tree, key);
    if (typeof value !== 'string' || value.trim() === '') {
      fail(`public/i18n/${lang}.json thiếu khoá '${key}' hoặc giá trị rỗng`);
    }
    if (value.includes('{{')) {
      fail(`'${key}' ở ${lang}.json có tham số nội suy — nhóm BOOTSTRAP_KEYS cấm tham số`);
    }
    bucket[key] = value;
  }

  // Sắp xếp khoá để kết quả ổn định giữa các lần chạy và giữa các máy.
  // So theo MÃ KÝ TỰ, không dùng localeCompare: localeCompare đọc locale mặc định
  // của máy đang chạy, nên thứ tự có thể khác giữa máy dev và CI — và khi đó `--check`
  // đỏ mà nội dung không hề lệch.
  result[lang] = Object.fromEntries(
    Object.entries(bucket).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
}

// LF, hai space, có newline cuối. Cố định để --check không đỏ vì lý do định dạng.
const output = `${JSON.stringify(result, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = existsSync(OUT_FILE) ? readFileSync(OUT_FILE, 'utf8') : '';
  if (current !== output) {
    fail(
      'bootstrap-messages.json đã lệch với public/i18n/*.json.\n' +
        '        Chạy: npm run i18n:gen  rồi commit file sinh ra.\n' +
        '        TUYỆT ĐỐI KHÔNG sửa tay bootstrap-messages.json, và không sửa JSON cho khớp nó.',
    );
  }
  console.log('[gen-bootstrap] --check: khớp');
} else {
  writeFileSync(OUT_FILE, output, 'utf8');
  console.log(`[gen-bootstrap] đã ghi ${OUT_FILE} (${keys.length} khoá × ${LANGS.length} ngôn ngữ)`);
}
