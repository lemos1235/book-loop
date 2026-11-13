# _db

数据库结构参考与手工脚本。

- `db.sql`：MySQL 语法的设计参考，带中文列注释，不直接用于运行。
- `init.sqlite.sql`：与 Drizzle schema 一致的 SQLite 建表脚本。

日常开发使用 `npm run db:push` 同步结构。

## 迁移脚本

每次较大的表结构修改生成一个 `migrate-<英文说明>.sql` 脚本，放在本目录。

- 全小写英文、连字符分隔，不加日期或序号前缀，例如 `migrate-book-isbn.sql`。
- 一个脚本对应一次修改，使用 SQLite 语法，尽量幂等。
- 同时更新 `db.sql`、`init.sqlite.sql`，并执行 `npm run db:push`。
