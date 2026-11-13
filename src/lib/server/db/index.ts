import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';
import * as authSchema from './auth.schema';
import * as businessSchema from './schema';

const databaseUrl = env.DATABASE_URL || 'local.db';

export const sqliteClient = new Database(databaseUrl);

export const db = drizzle(sqliteClient, {
  schema: { ...authSchema, ...businessSchema },
});

/** 同步事务（db.transaction）回调中的执行器类型 */
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** 可执行查询的对象：db 本身或事务执行器 */
export type DbExecutor = typeof db | DbTransaction;
