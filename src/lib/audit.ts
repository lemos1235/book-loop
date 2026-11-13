import { formatDateTime } from './format';

/** 审计日志的操作类型 */
export const AUDIT_ACTIONS = [
  'book.create',
  'book.update',
  'book.status',
  'book.delete',
  'member.create',
  'member.update',
  'member.status',
  'member.delete',
  'loan.create',
  'loan.return',
  'loan.renew',
  'setting.update',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_TARGET_TYPES = ['book', 'member', 'loan', 'setting'] as const;
export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number];

export function isAuditAction(value: unknown): value is AuditAction {
  return typeof value === 'string' && (AUDIT_ACTIONS as readonly string[]).includes(value);
}

export function isAuditTargetType(value: unknown): value is AuditTargetType {
  return typeof value === 'string' && (AUDIT_TARGET_TYPES as readonly string[]).includes(value);
}

export interface AuditLogView {
  /** DataTable 的泛型约束要求可索引 */
  [key: string]: unknown;
  id: number;
  userEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
  createdAt: number;
}

export const ACTION_LABELS: Record<string, string> = {
  'book.create': '新增图书',
  'book.update': '编辑图书',
  'book.status': '上下架图书',
  'book.delete': '删除图书',
  'member.create': '新增读者',
  'member.update': '编辑读者',
  'member.status': '启停读者',
  'member.delete': '删除读者',
  'loan.create': '登记借出',
  'loan.return': '归还图书',
  'loan.renew': '续借',
  'setting.update': '修改设置',
};

export const SETTING_LABELS: Record<string, string> = {
  'loan.rules': '借阅规则',
  announcement: '站点公告',
  maintenance: '维护模式',
};

export const TARGET_LABELS: Record<string, string> = {
  book: '图书',
  member: '读者',
  loan: '借阅',
  setting: '设置',
};

export const FIELD_LABELS: Record<string, string> = {
  title: '书名',
  author: '作者',
  isbn: 'ISBN',
  category: '分类',
  publisher: '出版社',
  publishedYear: '出版年份',
  totalCopies: '馆藏册数',
  availableCopies: '可借册数',
  shelf: '书架位置',
  status: '状态',
  note: '备注',
  memberNo: '读者编号',
  name: '姓名',
  phone: '手机号',
  email: '邮箱',
  joinedAt: '加入时间',
  bookId: '图书 ID',
  memberId: '读者 ID',
  borrowedAt: '借出时间',
  dueAt: '应还日期',
  returnedAt: '归还时间',
  renewCount: '续借次数',
  defaultLoanDays: '默认借期',
  maxRenewals: '最大续借次数',
  renewDays: '每次续借天数',
  blockOverdueBorrow: '逾期禁止再借',
  enabled: '启用',
  level: '级别',
  message: '文案',
};

const STATUS_LABELS: Record<string, string> = {
  active: '正常 / 在架',
  archived: '已下架',
  suspended: '已停用',
  borrowed: '在借',
  returned: '已归还',
};

const DATE_FIELDS = new Set(['joinedAt', 'borrowedAt', 'dueAt', 'returnedAt']);

export function formatAuditValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (DATE_FIELDS.has(key)) return formatDateTime(Number(value));
  if (key === 'status') return STATUS_LABELS[String(value)] ?? String(value);
  if (key === 'level') return value === 'warning' ? '提醒' : '信息';
  return String(value);
}

/** 对比 before / after，输出「字段：旧值 → 新值」；相同值不展示 */
export function describeAuditChange(row: Pick<AuditLogView, 'before' | 'after'>): string[] {
  const keys = new Set([...Object.keys(row.before ?? {}), ...Object.keys(row.after ?? {})]);
  return [...keys]
    .filter((key) => JSON.stringify(row.before?.[key]) !== JSON.stringify(row.after?.[key]))
    .map((key) => {
      const label = FIELD_LABELS[key] ?? key;
      const before = row.before?.[key];
      const after = row.after?.[key];
      if (before === undefined) return `${label}：${formatAuditValue(key, after)}`;
      return `${label}：${formatAuditValue(key, before)} → ${formatAuditValue(key, after)}`;
    });
}

export function auditTargetText(row: Pick<AuditLogView, 'targetType' | 'targetId'>): string {
  if (row.targetType === 'setting') {
    return SETTING_LABELS[row.targetId] ?? row.targetId;
  }
  return `${TARGET_LABELS[row.targetType] ?? row.targetType} #${row.targetId}`;
}
