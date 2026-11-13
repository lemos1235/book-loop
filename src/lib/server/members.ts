import { and, count, desc, eq, like, or, sql } from 'drizzle-orm';
import { db } from './db';
import { loan, member } from './db/schema';
import type { MemberInput } from './validation';
import { BusinessError, isUniqueConstraintError } from './errors';
import type { MemberOption, MemberStatusFilter, MemberView, Paginated } from '#lib/types';

export interface MemberListQuery {
  q: string;
  status: MemberStatusFilter;
  page: number;
  pageSize: number;
}

type MemberQueryRow = typeof member.$inferSelect & { activeLoans: number };

function toMemberView(row: MemberQueryRow): MemberView {
  return {
    id: row.id,
    memberNo: row.memberNo,
    name: row.name,
    phone: row.phone,
    email: row.email,
    status: row.status,
    joinedAt: row.joinedAt.getTime(),
    note: row.note,
    activeLoans: Number(row.activeLoans ?? 0),
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

// 子查询里的列必须显式带表名：未限定的 id 会被 SQLite 解析为 loan.id，
// 导致统计结果与读者无关。
const activeLoansSql = sql<number>`(
  select count(*) from loan
  where loan.member_id = member.id and loan.returned_at is null
)`.mapWith(Number);

export function listMembers(query: MemberListQuery): Paginated<MemberView> {
  const conditions = [];
  if (query.q) {
    const pattern = `%${query.q}%`;
    conditions.push(
      or(
        like(member.name, pattern),
        like(member.memberNo, pattern),
        like(member.phone, pattern),
        like(member.email, pattern),
      ),
    );
  }
  if (query.status !== 'all') conditions.push(eq(member.status, query.status));

  const where = conditions.length ? and(...conditions) : undefined;
  const total = db.select({ value: count() }).from(member).where(where).get()?.value ?? 0;
  const page = Math.min(query.page, Math.max(1, Math.ceil(total / query.pageSize)));
  const rows = db
    .select({ ...getMemberColumns(), activeLoans: activeLoansSql })
    .from(member)
    .where(where)
    .orderBy(desc(member.joinedAt), desc(member.id))
    .limit(query.pageSize)
    .offset((page - 1) * query.pageSize)
    .all()
    .map(toMemberView);

  return { rows, total, page, pageSize: query.pageSize };
}

function getMemberColumns() {
  return {
    id: member.id,
    memberNo: member.memberNo,
    name: member.name,
    phone: member.phone,
    email: member.email,
    status: member.status,
    joinedAt: member.joinedAt,
    note: member.note,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}

export function getMember(id: number): MemberView | null {
  const row = db
    .select({ ...getMemberColumns(), activeLoans: activeLoansSql })
    .from(member)
    .where(eq(member.id, id))
    .get();
  return row ? toMemberView(row) : null;
}

/** 生成 M-YYYY-0001 形式的读者编号，遇到占用则继续递增 */
function nextMemberNo(): string {
  const prefix = `M-${new Date().getFullYear()}-`;
  const last = db
    .select({ memberNo: member.memberNo })
    .from(member)
    .where(like(member.memberNo, `${prefix}%`))
    .orderBy(desc(member.memberNo))
    .limit(1)
    .get();
  let sequence = last ? Number(last.memberNo.slice(prefix.length)) + 1 : 1;
  if (!Number.isFinite(sequence) || sequence < 1) sequence = 1;
  let candidate = `${prefix}${String(sequence).padStart(4, '0')}`;
  while (db.select({ id: member.id }).from(member).where(eq(member.memberNo, candidate)).get()) {
    sequence += 1;
    candidate = `${prefix}${String(sequence).padStart(4, '0')}`;
  }
  return candidate;
}

export function createMember(input: MemberInput): number {
  const now = new Date();
  try {
    const created = db
      .insert(member)
      .values({
        memberNo: input.memberNo || nextMemberNo(),
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
        note: input.note || null,
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: member.id })
      .get();
    return created.id;
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new BusinessError('该读者编号已存在，请更换');
    throw error;
  }
}

export function updateMember(id: number, input: MemberInput): void {
  const existing = db.select().from(member).where(eq(member.id, id)).get();
  if (!existing) throw new BusinessError('读者不存在或已被删除');
  try {
    db.update(member)
      .set({
        memberNo: input.memberNo || existing.memberNo,
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
        note: input.note || null,
        updatedAt: new Date(),
      })
      .where(eq(member.id, id))
      .run();
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new BusinessError('该读者编号已存在，请更换');
    throw error;
  }
}

export function toggleMemberStatus(id: number): void {
  const existing = db.select().from(member).where(eq(member.id, id)).get();
  if (!existing) throw new BusinessError('读者不存在或已被删除');
  db.update(member)
    .set({
      status: existing.status === 'active' ? 'suspended' : 'active',
      updatedAt: new Date(),
    })
    .where(eq(member.id, id))
    .run();
}

export function deleteMember(id: number): void {
  const history = db
    .select({ value: count() })
    .from(loan)
    .where(eq(loan.memberId, id))
    .get()?.value;
  if (history) {
    throw new BusinessError('该读者已有借阅记录，无法删除；如需禁止借阅请改为停用');
  }
  db.delete(member).where(eq(member.id, id)).run();
}

/** 新建借阅弹窗用的读者选项：只列状态正常的读者 */
export function listMemberOptions(): MemberOption[] {
  return db
    .select({ id: member.id, name: member.name, memberNo: member.memberNo })
    .from(member)
    .where(eq(member.status, 'active'))
    .orderBy(member.name)
    .all();
}
