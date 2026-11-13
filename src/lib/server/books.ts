import { and, asc, count, desc, eq, like, or, sql } from 'drizzle-orm';
import { db } from './db';
import { book, loan } from './db/schema';
import type { BookInput } from './validation';
import { BusinessError, isUniqueConstraintError } from './errors';
import { diffSnapshot, recordAudit } from './audit';
import type { Actor } from './actor';
import type { BookOption, BookStatusFilter, BookView, Paginated } from '#lib/types';

export interface BookListQuery {
  q: string;
  category: string;
  status: BookStatusFilter;
  page: number;
  pageSize: number;
}

function toBookView(row: typeof book.$inferSelect): BookView {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    isbn: row.isbn,
    category: row.category,
    publisher: row.publisher,
    publishedYear: row.publishedYear,
    totalCopies: row.totalCopies,
    availableCopies: row.availableCopies,
    shelf: row.shelf,
    status: row.status,
    note: row.note,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

export function listBooks(query: BookListQuery): Paginated<BookView> & { categories: string[] } {
  const conditions = [];
  if (query.q) {
    const pattern = `%${query.q}%`;
    conditions.push(
      or(
        like(book.title, pattern),
        like(book.author, pattern),
        like(book.isbn, pattern),
        like(book.publisher, pattern),
      ),
    );
  }
  if (query.category) conditions.push(eq(book.category, query.category));
  if (query.status !== 'all') conditions.push(eq(book.status, query.status));

  const where = conditions.length ? and(...conditions) : undefined;
  const total = db.select({ value: count() }).from(book).where(where).get()?.value ?? 0;
  const page = Math.min(query.page, Math.max(1, Math.ceil(total / query.pageSize)));
  const rows = db
    .select()
    .from(book)
    .where(where)
    .orderBy(desc(book.createdAt), desc(book.id))
    .limit(query.pageSize)
    .offset((page - 1) * query.pageSize)
    .all()
    .map(toBookView);

  const categories = db
    .selectDistinct({ category: book.category })
    .from(book)
    .orderBy(asc(book.category))
    .all()
    .map((row) => row.category);

  return { rows, total, page, pageSize: query.pageSize, categories };
}

export function getBook(id: number): BookView | null {
  const row = db.select().from(book).where(eq(book.id, id)).get();
  return row ? toBookView(row) : null;
}

type BookRow = typeof book.$inferSelect;

/** 审计用的业务快照，不含自增主键与时间戳 */
function bookSnapshot(row: BookRow): Record<string, unknown> {
  return {
    title: row.title,
    author: row.author,
    isbn: row.isbn,
    category: row.category,
    publisher: row.publisher,
    publishedYear: row.publishedYear,
    totalCopies: row.totalCopies,
    availableCopies: row.availableCopies,
    shelf: row.shelf,
    status: row.status,
    note: row.note,
  };
}

export function createBook(actor: Actor, input: BookInput): number {
  const now = new Date();
  try {
    return db.transaction((tx) => {
      const created = tx
        .insert(book)
        .values({
          ...input,
          isbn: input.isbn || null,
          publisher: input.publisher || null,
          shelf: input.shelf || null,
          note: input.note || null,
          publishedYear: input.publishedYear ?? null,
          availableCopies: input.totalCopies,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: book.id })
        .get();

      const row = tx.select().from(book).where(eq(book.id, created.id)).get();
      recordAudit(tx, actor, {
        action: 'book.create',
        targetType: 'book',
        targetId: created.id,
        after: row ? bookSnapshot(row) : null,
      });
      return created.id;
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new BusinessError('该 ISBN 已存在，请检查后重试');
    throw error;
  }
}

export function updateBook(actor: Actor, id: number, input: BookInput): void {
  try {
    db.transaction((tx) => {
      const existing = tx.select().from(book).where(eq(book.id, id)).get();
      if (!existing) throw new BusinessError('图书不存在或已被删除');

      const borrowed = existing.totalCopies - existing.availableCopies;
      if (input.totalCopies < borrowed) {
        throw new BusinessError(`当前有 ${borrowed} 册在借，馆藏总数不能少于 ${borrowed}`);
      }

      tx.update(book)
        .set({
          ...input,
          isbn: input.isbn || null,
          publisher: input.publisher || null,
          shelf: input.shelf || null,
          note: input.note || null,
          publishedYear: input.publishedYear ?? null,
          availableCopies: input.totalCopies - borrowed,
          updatedAt: new Date(),
        })
        .where(eq(book.id, id))
        .run();

      const after = tx.select().from(book).where(eq(book.id, id)).get();
      if (!after) throw new BusinessError('图书信息读取失败');
      const diff = diffSnapshot(bookSnapshot(existing), bookSnapshot(after));
      recordAudit(tx, actor, {
        action: 'book.update',
        targetType: 'book',
        targetId: id,
        ...diff,
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new BusinessError('该 ISBN 已存在，请检查后重试');
    throw error;
  }
}

/** 上架 / 下架切换；下架不影响已借出的记录 */
export function toggleBookStatus(actor: Actor, id: number): void {
  db.transaction((tx) => {
    const existing = tx.select().from(book).where(eq(book.id, id)).get();
    if (!existing) throw new BusinessError('图书不存在或已被删除');

    const status = existing.status === 'active' ? 'archived' : 'active';
    tx.update(book).set({ status, updatedAt: new Date() }).where(eq(book.id, id)).run();
    recordAudit(tx, actor, {
      action: 'book.status',
      targetType: 'book',
      targetId: id,
      before: { status: existing.status },
      after: { status },
    });
  });
}

export function deleteBook(actor: Actor, id: number): void {
  db.transaction((tx) => {
    const history = tx
      .select({ value: count() })
      .from(loan)
      .where(eq(loan.bookId, id))
      .get()?.value;
    if (history) {
      throw new BusinessError('该图书已有借阅记录，无法删除；如需停止流通请改为下架');
    }

    const existing = tx.select().from(book).where(eq(book.id, id)).get();
    if (!existing) throw new BusinessError('图书不存在或已被删除');

    tx.delete(book).where(eq(book.id, id)).run();
    recordAudit(tx, actor, {
      action: 'book.delete',
      targetType: 'book',
      targetId: id,
      before: bookSnapshot(existing),
    });
  });
}

/** 新建借阅弹窗用的图书选项：只列在架图书，借完的置灰 */
export function listBookOptions(): BookOption[] {
  return db
    .select({
      id: book.id,
      title: book.title,
      author: book.author,
      availableCopies: book.availableCopies,
    })
    .from(book)
    .where(eq(book.status, 'active'))
    .orderBy(asc(book.title))
    .all();
}

/** 仪表盘：按分类统计馆藏册数 */
export function listCategoryStats(limit = 5): { name: string; copies: number }[] {
  return db
    .select({
      name: book.category,
      copies: sql<number>`coalesce(sum(${book.totalCopies}), 0)`,
    })
    .from(book)
    .where(eq(book.status, 'active'))
    .groupBy(book.category)
    .orderBy(desc(sql`coalesce(sum(${book.totalCopies}), 0)`))
    .limit(limit)
    .all();
}
