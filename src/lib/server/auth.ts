import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '#lib/server/db';
import { account, session, user, verification } from '#lib/server/db/auth.schema';

const secret = env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error('BETTER_AUTH_SECRET is not set (see .env.example)');
}

const trustedOrigins = [
  'http://127.0.0.1:15174',
  'http://localhost:15174',
  ...(env.ORIGIN ? [env.ORIGIN] : []),
];

/**
 * 固定邮箱密码登录：
 * - 只开启 email + password，关闭公开注册（账号由 npm run db:seed 预置）；
 * - 不启用邮箱验证、找回密码等任何发信流程。
 */
export const auth = betterAuth({
  baseURL: env.ORIGIN || undefined,
  secret,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60,
  },
  advanced: {
    database: {
      // 主键由 SQLite 自增，与 auth.schema.ts 的 integer('id') 一致
      generateId: false,
    },
  },
  plugins: [sveltekitCookies(getRequestEvent)],
});
