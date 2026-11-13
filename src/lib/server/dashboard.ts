import { and, count, eq, gte, lt, or, sql } from 'drizzle-orm';
import { db } from './db';
import { book, loan, member } from './db/schema';
import { listCategoryStats } from './books';
import { getLoanCounts, listLoans } from './loans';
import { addDays, startOfDay, toDateInputValue } from '#lib/format';
import type { DashboardData, TrendPoint } from '#lib/types';

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function getDashboard(): DashboardData {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const since = addDays(today, -6);

  const bookStats = db
    .select({
      titles: count(),
      copies: sql<number>`coalesce(sum(${book.totalCopies}), 0)`,
      available: sql<number>`coalesce(sum(${book.availableCopies}), 0)`,
    })
    .from(book)
    .where(eq(book.status, 'active'))
    .get();

  const members = db
    .select({ value: count() })
    .from(member)
    .where(eq(member.status, 'active'))
    .get()?.value;

  const todayBorrowed = db
    .select({ value: count() })
    .from(loan)
    .where(and(gte(loan.borrowedAt, today), lt(loan.borrowedAt, tomorrow)))
    .get()?.value;

  const todayReturned = db
    .select({ value: count() })
    .from(loan)
    .where(and(gte(loan.returnedAt, today), lt(loan.returnedAt, tomorrow)))
    .get()?.value;

  const loanCounts = getLoanCounts();

  const trendRows = db
    .select({ borrowedAt: loan.borrowedAt, returnedAt: loan.returnedAt })
    .from(loan)
    .where(or(gte(loan.borrowedAt, since), gte(loan.returnedAt, since)))
    .all();

  const trend: TrendPoint[] = [];
  const buckets = new Map<string, TrendPoint>();
  for (let index = 0; index < 7; index += 1) {
    const day = addDays(since, index);
    const point: TrendPoint = {
      key: toDateInputValue(day),
      label: `${day.getMonth() + 1}/${day.getDate()}`,
      weekday: WEEKDAYS[day.getDay()],
      borrowed: 0,
      returned: 0,
    };
    trend.push(point);
    buckets.set(point.key, point);
  }

  for (const row of trendRows) {
    if (row.borrowedAt >= since) {
      const point = buckets.get(toDateInputValue(row.borrowedAt));
      if (point) point.borrowed += 1;
    }
    if (row.returnedAt && row.returnedAt >= since) {
      const point = buckets.get(toDateInputValue(row.returnedAt));
      if (point) point.returned += 1;
    }
  }

  return {
    stats: {
      titles: bookStats?.titles ?? 0,
      copies: Number(bookStats?.copies ?? 0),
      available: Number(bookStats?.available ?? 0),
      activeLoans: loanCounts.borrowed + loanCounts.overdue,
      overdueLoans: loanCounts.overdue,
      members: members ?? 0,
      todayBorrowed: todayBorrowed ?? 0,
      todayReturned: todayReturned ?? 0,
    },
    trend,
    categories: listCategoryStats(5),
    recent: listLoans({ q: '', status: 'all', page: 1, pageSize: 6 }).rows,
    overdue: listLoans({ q: '', status: 'overdue', page: 1, pageSize: 5 }).rows,
    now: now.getTime(),
  };
}
