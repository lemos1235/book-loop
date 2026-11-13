/**
 * 修改固定账号的登录密码（无邮件找回流程）。
 * 用法：npm run user:password -- admin@bookloop.local 新密码
 */
import Database from 'better-sqlite3';
import { hashPassword } from 'better-auth/crypto';

const [email, password] = process.argv.slice(2);
const DATABASE_URL = process.env.DATABASE_URL || 'local.db';

if (!email || !password) {
  console.error('用法：npm run user:password -- <邮箱> <新密码>');
  process.exit(1);
}
if (password.length < 8) {
  console.error('密码至少 8 位');
  process.exit(1);
}

const db = new Database(DATABASE_URL);
const user = db.prepare('select id from user where email = ?').get(email);
if (!user) {
  console.error(`账号不存在：${email}`);
  process.exit(1);
}

const passwordHash = await hashPassword(password);
const now = Date.now();
const account = db
  .prepare("select id from account where user_id = ? and provider_id = 'credential'")
  .get(user.id);

if (account) {
  db.prepare('update account set password = ?, updated_at = ? where id = ?').run(
    passwordHash,
    now,
    account.id,
  );
} else {
  db.prepare(
    `insert into account (account_id, provider_id, user_id, password, created_at, updated_at)
     values (?, 'credential', ?, ?, ?, ?)`,
  ).run(String(user.id), user.id, passwordHash, now, now);
}

// 修改密码后让该账号所有已登录会话失效
db.prepare('delete from session where user_id = ?').run(user.id);

console.log(`已更新 ${email} 的密码，并注销该账号的全部会话。`);
db.close();
