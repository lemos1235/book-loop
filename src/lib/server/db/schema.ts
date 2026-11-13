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

/** 系统设置：每个设置项一行，value 为 JSON，结构与默认值见 server/settings.ts */
export const systemConfig = sqliteTable('system_config', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).$type<unknown>().notNull(),
  updatedBy: integer('updated_by'),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

/** 操作审计：与业务变更在同一事务写入，只增不改 */
export const auditLog = sqliteTable(
  'audit_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull(),
    /** 操作者邮箱快照，账号信息变化后仍可追溯 */
    userEmail: text('user_email').notNull(),
    /** 操作类型，见 server/audit.ts AUDIT_ACTIONS */
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    /** 变更前后的字段快照 */
    before: text('before', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    after: text('after', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    ip: text('ip'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('idx_audit_log_action').on(table.action),
    index('idx_audit_log_target').on(table.targetType, table.targetId),
    index('idx_audit_log_created_at').on(table.createdAt),
  ],
);

export type BookRow = typeof book.$inferSelect;
export type MemberRow = typeof member.$inferSelect;
export type LoanRow = typeof loan.$inferSelect;
export type SystemConfigRow = typeof systemConfig.$inferSelect;
export type AuditLogRow = typeof auditLog.$inferSelect;
