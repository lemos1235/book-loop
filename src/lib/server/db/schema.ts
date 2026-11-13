import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const BOOK_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;

export const MEMBER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
} as const;

export type BookStatus = (typeof BOOK_STATUS)[keyof typeof BOOK_STATUS];
export type MemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];

const now = () => new Date();

/** 图书：totalCopies 为馆藏总量，availableCopies 随借还实时变化 */
export const book = sqliteTable(
  'book',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    author: text('author').notNull(),
    isbn: text('isbn'),
    category: text('category').default('未分类').notNull(),
    publisher: text('publisher'),
    publishedYear: integer('published_year'),
    totalCopies: integer('total_copies').default(1).notNull(),
    availableCopies: integer('available_copies').default(1).notNull(),
    shelf: text('shelf'),
    status: text('status', { enum: ['active', 'archived'] })
      .default('active')
      .notNull(),
    note: text('note'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).$defaultFn(now).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$defaultFn(now).notNull(),
  },
  (table) => [
    uniqueIndex('uk_book_isbn').on(table.isbn),
    index('idx_book_category').on(table.category),
    index('idx_book_status').on(table.status),
  ],
);

/** 读者：memberNo 由系统生成或手动录入，phone 可为空 */
export const member = sqliteTable(
  'member',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    memberNo: text('member_no').notNull(),
    name: text('name').notNull(),
    phone: text('phone'),
    email: text('email'),
    status: text('status', { enum: ['active', 'suspended'] })
      .default('active')
      .notNull(),
    joinedAt: integer('joined_at', { mode: 'timestamp_ms' }).$defaultFn(now).notNull(),
    note: text('note'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).$defaultFn(now).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$defaultFn(now).notNull(),
  },
  (table) => [
    uniqueIndex('uk_member_member_no').on(table.memberNo),
    index('idx_member_status').on(table.status),
  ],
);

/** 借阅记录：returnedAt 为空表示未归还；逾期状态由 dueAt 与当前时间实时推导 */
export const loan = sqliteTable(
  'loan',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    bookId: integer('book_id')
      .notNull()
      .references(() => book.id),
    memberId: integer('member_id')
      .notNull()
      .references(() => member.id),
    borrowedAt: integer('borrowed_at', { mode: 'timestamp_ms' }).notNull(),
    dueAt: integer('due_at', { mode: 'timestamp_ms' }).notNull(),
    returnedAt: integer('returned_at', { mode: 'timestamp_ms' }),
    renewCount: integer('renew_count').default(0).notNull(),
    note: text('note'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).$defaultFn(now).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$defaultFn(now).notNull(),
  },
  (table) => [
    index('idx_loan_book_id').on(table.bookId),
    index('idx_loan_member_id').on(table.memberId),
    index('idx_loan_due_at').on(table.dueAt),
  ],
);

export type BookRow = typeof book.$inferSelect;
export type MemberRow = typeof member.$inferSelect;
export type LoanRow = typeof loan.$inferSelect;
