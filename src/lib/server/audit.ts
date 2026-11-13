import { and, count, desc, eq } from 'drizzle-orm';
import { db, type DbExecutor } from './db';
import { auditLog } from './db/schema';
import {
  AUDIT_ACTIONS,
  isAuditAction,
  type AuditAction,
  type AuditLogView,
  type AuditTargetType,
} from '#lib/audit';
import type { Actor } from './actor';

export { AUDIT_ACTIONS, isAuditAction };
export type { AuditAction, AuditLogView, AuditTargetType };

export interface AuditEntry {
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string | number;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

/** 追加一条审计日志；必须与被记录的变更处于同一事务 */
export function recordAudit(tx: DbExecutor, actor: Actor, entry: AuditEntry): void {
  tx.insert(auditLog)
    .values({
      userId: actor.userId,
      userEmail: actor.email,
      action: entry.action,
      targetType: entry.targetType,
      targetId: String(entry.targetId),
      before: entry.before ?? null,
      after: entry.after ?? null,
      ip: actor.ip,
      createdAt: new Date(),
    })
    .run();
}

/** 只保留值有变化的字段，减少审计噪音；新增 / 删除时传空对象即可 */
export function diffSnapshot(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): { before: Record<string, unknown>; after: Record<string, unknown> } {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changedBefore: Record<string, unknown> = {};
  const changedAfter: Record<string, unknown> = {};
  for (const key of keys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changedBefore[key] = before[key] ?? null;
      changedAfter[key] = after[key] ?? null;
    }
  }
  return { before: changedBefore, after: changedAfter };
}

type AuditLogRow = typeof auditLog.$inferSelect;

function toAuditLogView(row: AuditLogRow): AuditLogView {
  return {
    id: row.id,
    userEmail: row.userEmail,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    before: row.before ?? null,
    after: row.after ?? null,
    ip: row.ip,
    createdAt: row.createdAt.getTime(),
  };
}

export interface AuditLogQuery {
  action: AuditAction | null;
  /** 同时提供 targetType 与 targetId 时才按对象筛选 */
  targetType?: AuditTargetType | null;
  targetId?: string | null;
  page: number;
  pageSize: number;
}

/** 按时间倒序分页查询审计日志 */
export function listAuditLogs(query: AuditLogQuery): {
  rows: AuditLogView[];
  total: number;
  page: number;
} {
  const conditions = [
    query.action ? eq(auditLog.action, query.action) : undefined,
    query.targetType ? eq(auditLog.targetType, query.targetType) : undefined,
    query.targetId ? eq(auditLog.targetId, query.targetId) : undefined,
  ].filter((condition) => condition !== undefined);
  const where = conditions.length ? and(...conditions) : undefined;

  const total = db.select({ value: count() }).from(auditLog).where(where).get()?.value ?? 0;
  const page = Math.min(query.page, Math.max(1, Math.ceil(total / query.pageSize)));
  const rows = db
    .select()
    .from(auditLog)
    .where(where)
    .orderBy(desc(auditLog.id))
    .limit(query.pageSize)
    .offset((page - 1) * query.pageSize)
    .all()
    .map(toAuditLogView);

  return { rows, total, page };
}
