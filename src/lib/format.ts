const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const shortDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
});

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const fullDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

export function formatDate(ms: number | null | undefined): string {
  return ms ? dateFormatter.format(ms) : '—';
}

export function formatShortDate(ms: number | null | undefined): string {
  return ms ? shortDateFormatter.format(ms) : '—';
}

export function formatDateTime(ms: number | null | undefined): string {
  return ms ? dateTimeFormatter.format(ms) : '—';
}

export function formatFullDate(ms: number | null | undefined): string {
  return ms ? fullDateFormatter.format(ms) : '—';
}

/** 本地日期 → yyyy-MM-dd，用于 <input type="date"> */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/** 逾期天数（向上取整，至少 1 天） */
export function overdueDays(dueMs: number, now = Date.now()): number {
  return Math.max(1, Math.ceil((now - dueMs) / 86_400_000));
}

export function todayIso(): string {
  return toDateInputValue(new Date());
}

/** 解析 <input type="date"> 的值，归还日按当天 23:59:59 计，避免当天零点即逾期 */
export function parseDueDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 23, 59, 59, 999);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}
