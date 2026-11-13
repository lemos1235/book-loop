import { and, count, desc, eq, gte, isNotNull, isNull, like, lt, or, sql } from 'drizzle-orm';
import { db } from './db';
import { book, loan, member } from './db/schema';
import type { LoanInput } from './validation';
import { BusinessError } from './errors';
import { addDays, formatDate, parseDueDate, startOfDay } from '#lib/format';
import type { LoanCounts, LoanStatus, LoanStatusFilter, LoanView, Paginated } from '#lib/types';

export interface LoanListQuery {
  q: string;
  status: LoanStatusFilter;
  page: number;
  pageSize: number;
}

const RENEW_DAYS = 14;
const MAX_RENEWALS = 2;

function deriveStatus(returnedAt: Date | null, dueAt: Date, now: Date): LoanStatus {
  if (returnedAt) return 'returned';
  return dueAt.getTime() < now.getTime() ? 'overdue' : 'borrowed';
}

interface LoanQueryRow {
  id: number;
  bookId: number;
  bookTitle: string;
  bookAuthor: string;
  memberId: number;
  memberName: string;
  memberNo: string;
  borrowedAt: Date;
  dueAt: Date;
  returnedAt: Date | null;
  renewCount: number;
  note: string | null;
}

function toLoanView(row: LoanQueryRow, now = new Date()): LoanView {
  return {
    id: row.id,
    bookId: row.bookId,
    bookTitle: row.bookTitle,
    bookAuthor: row.bookAuthor,
    memberId: row.memberId,
    memberName: row.memberName,
    memberNo: row.memberNo,
    borrowedAt: row.borrowedAt.getTime(),
    dueAt: row.dueAt.getTime(),
    returnedAt: row.returnedAt ? row.returnedAt.getTime() : null,
    renewCount: row.renewCount,
    note: row.note,
    status: deriveStatus(row.returnedAt, row.dueAt, now),
  };
}

const loanColumns = {
  id: loan.id,
  bookId: loan.bookId,
  bookTitle: book.title,
  bookAuthor: book.author,
  memberId: loan.memberId,
  memberName: member.name,
  memberNo: member.memberNo,
  borrowedAt: loan.borrowedAt,
  dueAt: loan.dueAt,
  returnedAt: loan.returnedAt,
  renewCount: loan.renewCount,
  note: loan.note,
};

function statusCondition(status: LoanStatus, now: Date) {
  if (status === 'returned') return isNotNull(loan.returnedAt);
  if (status === 'overdue') return and(isNull(loan.returnedAt), lt(loan.dueAt, now));
  return and(isNull(loan.returnedAt), gte(loan.dueAt, now));
}

export function listLoans(query: LoanListQuery): Paginated<LoanView> {
  const now = new Date();
  const conditions = [];
  if (query.q) {
    const pattern = `%${query.q}%`;
    conditions.push(
      or(
        like(book.title, pattern),
        like(book.author, pattern),
        like(member.name, pattern),
        like(member.memberNo, pattern),
      ),
    );
  }
  if (query.status !== 'all') conditions.push(statusCondition(query.status, now));

  const where = conditions.length ? and(...conditions) : undefined;
  const base = db
    .select(loanColumns)
    .from(loan)
    .innerJoin(book, eq(loan.bookId, book.id))
    .innerJoin(member, eq(loan.memberId, member.id));

  const total =
    db
      .select({ value: count() })
      .from(loan)
      .innerJoin(book, eq(loan.bookId, book.id))
      .innerJoin(member, eq(loan.memberId, member.id))
      .where(where)
      .get()?.value ?? 0;

  const page = Math.min(query.page, Math.max(1, Math.ceil(total / query.pageSize)));
  const rows = base
    .where(where)
    .orderBy(sql`${loan.returnedAt} is not null`, desc(loan.borrowedAt), desc(loan.id))
    .limit(query.pageSize)
    .offset((page - 1) * query.pageSize)
    .all()
    .map((row) => toLoanView(row, now));

  return { rows, total, page, pageSize: query.pageSize };
}

export function getLoanCounts(): LoanCounts {
  const now = new Date();
  const value = (condition: ReturnType<typeof statusCondition> | undefined) =>
    db.select({ value: count() }).from(loan).where(condition).get()?.value ?? 0;

  return {
    all: value(undefined),
    borrowed: value(statusCondition('borrowed', now)),
    overdue: value(statusCondition('overdue', now)),
    returned: value(statusCondition('returned', now)),
  };
}

/** 借出：校验库存、读者状态与逾期情况，并在同一事务内扣减可借数量 */
export function createLoan(input: LoanInput): LoanView {
  const now = new Date();
  const dueAt = parseDueDate(input.dueAt);
  if (!dueAt) throw new BusinessError('应还日期格式不正确');
  if (dueAt.getTime() < startOfDay(now).getTime()) {
    throw new BusinessError('应还日期不能早于今天');
  }

  return db.transaction((tx) => {
    const bookRow = tx.select().from(book).where(eq(book.id, input.bookId)).get();
    if (!bookRow) throw new BusinessError('图书不存在或已被删除');
    if (bookRow.status !== 'active') throw new BusinessError('该图书已下架，暂不可借阅');
    if (bookRow.availableCopies <= 0) throw new BusinessError('该图书已全部借出，暂无库存');

    const memberRow = tx.select().from(member).where(eq(member.id, input.memberId)).get();
    if (!memberRow) throw new BusinessError('读者不存在或已被删除');
    if (memberRow.status !== 'active') throw new BusinessError('该读者已停用，无法借阅');

    const duplicated = tx
      .select({ id: loan.id })
      .from(loan)
      .where(
        and(
          eq(loan.bookId, input.bookId),
          eq(loan.memberId, input.memberId),
          isNull(loan.returnedAt),
        ),
      )
      .get();
    if (duplicated) throw new BusinessError('该读者已借阅此书且尚未归还');

    const overdue = tx
      .select({ value: count() })
      .from(loan)
      .where(and(eq(loan.memberId, input.memberId), isNull(loan.returnedAt), lt(loan.dueAt, now)))
      .get()?.value;
    if (overdue) throw new BusinessError('该读者有逾期未还图书，请先归还后再借');

    const created = tx
      .insert(loan)
      .values({
        bookId: input.bookId,
        memberId: input.memberId,
        borrowedAt: now,
        dueAt,
        note: input.note || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: loan.id })
      .get();

    tx.update(book)
      .set({ availableCopies: bookRow.availableCopies - 1, updatedAt: now })
      .where(eq(book.id, input.bookId))
      .run();

    const row = tx
      .select(loanColumns)
      .from(loan)
      .innerJoin(book, eq(loan.bookId, book.id))
      .innerJoin(member, eq(loan.memberId, member.id))
      .where(eq(loan.id, created.id))
      .get();
    if (!row) throw new BusinessError('借阅记录创建失败，请重试');
    return toLoanView(row, now);
  });
}

/** 归还：写回归还时间并恢复库存（库存不超过馆藏总量） */
export function returnLoan(id: number): LoanView {
  const now = new Date();
  return db.transaction((tx) => {
    const existing = tx.select().from(loan).where(eq(loan.id, id)).get();
    if (!existing) throw new BusinessError('借阅记录不存在');
    if (existing.returnedAt) throw new BusinessError('该图书已经归还');

    const bookRow = tx.select().from(book).where(eq(book.id, existing.bookId)).get();
    if (!bookRow) throw new BusinessError('关联图书不存在');

    tx.update(loan).set({ returnedAt: now, updatedAt: now }).where(eq(loan.id, id)).run();

    tx.update(book)
      .set({
        availableCopies: Math.min(bookRow.totalCopies, bookRow.availableCopies + 1),
        updatedAt: now,
      })
      .where(eq(book.id, existing.bookId))
      .run();

    const row = tx
      .select(loanColumns)
      .from(loan)
      .innerJoin(book, eq(loan.bookId, book.id))
      .innerJoin(member, eq(loan.memberId, member.id))
      .where(eq(loan.id, id))
      .get();
    if (!row) throw new BusinessError('借阅记录读取失败');
    return toLoanView(row, now);
  });
}

/** 续借：未逾期时可续借，最长 2 次，每次 14 天 */
export function renewLoan(id: number): LoanView {
  const now = new Date();
  return db.transaction((tx) => {
    const existing = tx.select().from(loan).where(eq(loan.id, id)).get();
    if (!existing) throw new BusinessError('借阅记录不存在');
    if (existing.returnedAt) throw new BusinessError('该图书已经归还，无需续借');
    if (existing.dueAt.getTime() < now.getTime()) {
      throw new BusinessError('该借阅已逾期，无法续借，请先归还');
    }
    if (existing.renewCount >= MAX_RENEWALS) {
      throw new BusinessError(`最多可续借 ${MAX_RENEWALS} 次`);
    }

    const nextDueAt = addDays(existing.dueAt, RENEW_DAYS);
    tx.update(loan)
      .set({ dueAt: nextDueAt, renewCount: existing.renewCount + 1, updatedAt: now })
      .where(eq(loan.id, id))
      .run();

    const row = tx
      .select(loanColumns)
      .from(loan)
      .innerJoin(book, eq(loan.bookId, book.id))
      .innerJoin(member, eq(loan.memberId, member.id))
      .where(eq(loan.id, id))
      .get();
    if (!row) throw new BusinessError('借阅记录读取失败');
    return toLoanView(row, now);
  });
}

export function renewResultMessage(view: LoanView): string {
  return `已续借 ${RENEW_DAYS} 天，新的应还日期为 ${formatDate(view.dueAt)}`;
}
