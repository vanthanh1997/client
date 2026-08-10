import { AppLang, CURRENCY_CODE } from '@core/i18n/lang';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
export type DatePreset = 'date' | 'dateTime' | 'time' | 'dayMonth' | 'full';
export type NumberPreset = 'decimal' | 'integer' | 'compact';
export type MoneyPreset = 'money' | 'moneyCompact';

const DATE_PRESETS: Record<DatePreset, Intl.DateTimeFormatOptions> = {
  date: { day: '2-digit', month: '2-digit', year: 'numeric' },
  dateTime: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
  time: { hour: '2-digit', minute: '2-digit' },
  dayMonth: { day: '2-digit', month: '2-digit' },
  full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
};

const NUMBER_PRESETS: Record<NumberPreset, Intl.NumberFormatOptions> = {
  decimal: { maximumFractionDigits: 2 },
  integer: { maximumFractionDigits: 0 },
  compact: { notation: 'compact', maximumFractionDigits: 1 },
};

export function toAppDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? new Date(value) : null;
  }
  if (typeof value !== 'string') {
    return null;
  }

  const text = value.trim();
  if (text === '') {
    return null;
  }

  if (DATE_ONLY.test(text)) {
    const [year, month, day] = text.split('-').map(Number);
    // Nửa đêm ĐỊA PHƯƠNG, không phải UTC.
    const local = new Date(year, month - 1, day);
    return Number.isNaN(local.getTime()) ? null : local;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const text = value.trim();
    if (text === '') return null;
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function formatDate(locale: string, value: unknown, preset: DatePreset = 'date'): string {
  const date = toAppDate(value);
  if (date === null) return '';
  return new Intl.DateTimeFormat(locale, DATE_PRESETS[preset]).format(date);
}

export function formatNumber(
  locale: string,
  value: unknown,
  preset: NumberPreset = 'decimal',
): string {
  const number = toFiniteNumber(value);
  if (number === null) return '';
  return new Intl.NumberFormat(locale, NUMBER_PRESETS[preset]).format(number);
}

export function formatMoney(locale: string, value: unknown, preset: MoneyPreset = 'money'): string {
  const number = toFiniteNumber(value);
  if (number === null) return '';

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: CURRENCY_CODE,
    currencyDisplay: locale.startsWith('vi') ? 'symbol' : 'code',
    maximumFractionDigits: preset === 'moneyCompact' ? 1 : 0,
  };
  if (preset === 'moneyCompact') {
    options.notation = 'compact';
  }

  return new Intl.NumberFormat(locale, options).format(number);
}

export function formatPercent(locale: string, value: unknown, maxFractionDigits = 1): string {
  const number = toFiniteNumber(value);
  if (number === null) return '';
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: maxFractionDigits,
  }).format(number);
}

const RELATIVE_DIVISIONS: readonly (readonly [number, Intl.RelativeTimeFormatUnit])[] = [
  [60, 'second'],
  [60, 'minute'],
  [24, 'hour'],
  [7, 'day'],
  [4.34524, 'week'],
  [12, 'month'],
  [Number.POSITIVE_INFINITY, 'year'],
];

export function formatRelativeTime(locale: string, value: unknown, now: Date = new Date()): string {
  const date = toAppDate(value);
  if (date === null) return '';

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  let delta = (date.getTime() - now.getTime()) / 1000;

  for (const [amount, unit] of RELATIVE_DIVISIONS) {
    if (Math.abs(delta) < amount) {
      return formatter.format(Math.round(delta), unit);
    }
    delta /= amount;
  }
  return formatter.format(Math.round(delta), 'year');
}

export function compareStrings(locale: string, a: string, b: string): number {
  return new Intl.Collator(locale, { sensitivity: 'base', numeric: true }).compare(a, b);
}
export function selectPlural(locale: string, count: number): Intl.LDMLPluralRule {
  return new Intl.PluralRules(locale).select(count);
}

export function normalizeSpaces(text: string): string {
  return text.replace(/[  ]/g, ' ');
}

export function intlKey(locale: string, preset: string, currency?: AppLang | string): string {
  return `${locale}|${preset}|${currency ?? ''}`;
}
