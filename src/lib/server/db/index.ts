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
