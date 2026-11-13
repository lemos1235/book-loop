import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, type DbExecutor } from './db';
import { systemConfig } from './db/schema';
import { recordAudit } from './audit';
import type { Actor } from './actor';

const int = (min: number, max: number, label: string) =>
  z
    .number({ error: `${label}必须是整数` })
    .int(`${label}必须是整数`)
    .min(min, `${label}不能小于 ${min}`)
    .max(max, `${label}不能大于 ${max}`);

/** 借阅规则：保存后立即影响新的借出与续借，已存在的借阅记录不回溯 */
const loanRulesSchema = z.object({
  defaultLoanDays: int(1, 365, '默认借期'),
  maxRenewals: int(0, 10, '最大续借次数'),
  renewDays: int(1, 365, '每次续借天数'),
  blockOverdueBorrow: z.boolean(),
});

/** 站点公告：显示在导航栏下方，用户可关闭 */
const announcementSchema = z
  .object({
    enabled: z.boolean(),
    level: z.enum(['info', 'warning']),
    message: z.string().trim().max(500, '公告正文最多 500 个字符'),
  })
  .refine((value) => !value.enabled || Boolean(value.message), {
    message: '启用公告时请填写公告正文',
    path: ['message'],
  });

/** 维护模式：暂停借出与续借，归还仍可正常办理 */
const maintenanceSchema = z.object({
  enabled: z.boolean(),
  message: z.string().trim().max(500, '维护提示最多 500 个字符'),
});

/** 设置项的结构与默认值；默认值与改为可配置前代码中的常量一致 */
const SETTINGS = {
  'loan.rules': {
    schema: loanRulesSchema,
    defaults: {
      defaultLoanDays: 30,
      maxRenewals: 2,
      renewDays: 14,
      blockOverdueBorrow: true,
    },
  },
  announcement: {
    schema: announcementSchema,
    defaults: { enabled: false, level: 'info', message: '' },
  },
  maintenance: {
    schema: maintenanceSchema,
    defaults: { enabled: false, message: '' },
  },
} as const satisfies Record<string, { schema: z.ZodType; defaults: unknown }>;

export type SettingKey = keyof typeof SETTINGS;
export type SettingValue<K extends SettingKey> = z.infer<(typeof SETTINGS)[K]['schema']>;
export type LoanRules = SettingValue<'loan.rules'>;
export type AnnouncementSetting = SettingValue<'announcement'>;
export type MaintenanceSetting = SettingValue<'maintenance'>;

export interface SettingRecord<K extends SettingKey> {
  value: SettingValue<K>;
  /** 从未保存过时为 null（使用默认值） */
  updatedAt: number | null;
}

/** 从指定执行器读取；未保存过或存量数据不符合当前结构时回落到默认值 */
function readSettingRecord<K extends SettingKey>(executor: DbExecutor, key: K): SettingRecord<K> {
  const { schema, defaults } = SETTINGS[key];
  const row = executor.select().from(systemConfig).where(eq(systemConfig.key, key)).get();
  const parsed = row ? schema.safeParse(row.value) : null;
  return {
    value: (parsed?.success ? parsed.data : defaults) as SettingValue<K>,
    updatedAt: parsed?.success ? row!.updatedAt.getTime() : null,
  };
}

/**
 * 读取设置项。直接查 SQLite 主键，不做进程内缓存，修改后立即生效。
 */
export function getSettingRecord<K extends SettingKey>(key: K): SettingRecord<K> {
  return readSettingRecord(db, key);
}

export function getSetting<K extends SettingKey>(key: K): SettingValue<K> {
  return getSettingRecord(key).value;
}

/**
 * 校验并保存设置项，与被审计变更和审计日志处于同一事务。
 * 校验失败抛出 ZodError；返回是否有变化。
 */
export function updateSetting<K extends SettingKey>(actor: Actor, key: K, input: unknown): boolean {
  const value = SETTINGS[key].schema.parse(input) as SettingValue<K>;
  return db.transaction((tx) => {
    const before = readSettingRecord(tx, key).value;
    if (JSON.stringify(before) === JSON.stringify(value)) return false;

    const now = new Date();
    tx.insert(systemConfig)
      .values({ key, value, updatedBy: actor.userId, updatedAt: now })
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: { value, updatedBy: actor.userId, updatedAt: now },
      })
      .run();

    recordAudit(tx, actor, {
      action: 'setting.update',
      targetType: 'setting',
      targetId: key,
      before: before as Record<string, unknown>,
      after: value as Record<string, unknown>,
    });
    return true;
  });
}

// ---------- 业务读取 ----------

export function getLoanRules(): LoanRules {
  return getSetting('loan.rules');
}

export const DEFAULT_MAINTENANCE_MESSAGE = '系统维护中，暂停借出与续借，归还仍可正常办理。';

/** 维护模式提示文案；未填写时使用默认文案 */
export function getMaintenanceMessage(): string {
  const setting = getSetting('maintenance');
  return setting.message || DEFAULT_MAINTENANCE_MESSAGE;
}

export function isMaintenanceEnabled(): boolean {
  return getSetting('maintenance').enabled;
}

/** 下发给前端的站点状态：公告与维护提示 */
export interface SiteNotice {
  maintenance: { message: string } | null;
  announcement: {
    level: 'info' | 'warning';
    message: string;
    /** 修改时间作为版本号：内容变化后，之前关闭过公告的用户会重新看到 */
    version: number;
  } | null;
}

export function getSiteNotice(): SiteNotice {
  const maintenance = getSetting('maintenance');
  const announcement = getSettingRecord('announcement');
  const announcementMessage = announcement.value.enabled ? announcement.value.message : '';
  return {
    maintenance: maintenance.enabled ? { message: getMaintenanceMessage() } : null,
    announcement: announcementMessage
      ? {
          level: announcement.value.level,
          message: announcementMessage,
          version: announcement.updatedAt ?? 0,
        }
      : null,
  };
}
