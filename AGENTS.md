# AGENTS.md

本文件为在本仓库中工作的 AI 编码代理提供指引。

## 常用命令

```bash
npm run dev              # 开发服务器（localhost:15173）
npm run build            # 生产构建；npm start 运行产物
npm run check            # 类型检查
npm run lint             # Prettier 检查；npm run format 自动修复
npm run db:push          # 同步 Drizzle schema 到 SQLite
npm run db:seed          # 创建固定管理员与演示数据
npm run user:password -- <邮箱> <新密码>
```

## 技术栈

SvelteKit 2、Svelte 5（runes）、TypeScript、Tailwind CSS 4、shadcn-svelte（Bits UI）、Drizzle ORM + better-sqlite3、Better Auth、Zod、svelte-sonner。

## 目录树

```text
├── _db/                     数据库参考结构与迁移脚本
├── scripts/                 seed / 改密脚本
├── src/
│   ├── app.css              Tailwind、绿色主题与 shadcn 变量
│   ├── hooks.server.ts      Better Auth 会话与安全响应头
│   ├── lib/
│   │   ├── audit.ts         审计动作、中文标签与变更格式化（客户端共享）
│   │   ├── components/      业务组件；ui/ 为 shadcn 生成组件
│   │   └── server/          actor、audit、settings、auth、db、books / members / loans / dashboard 等
│   └── routes/
│       ├── login/
│       └── (app)/           工作台、图书、读者（含详情）、借阅、系统设置、审计日志
└── components.json          shadcn-svelte 配置
```

## 约定

- **认证**：固定邮箱 + 密码，`disableSignUp: true`，不发送任何邮件；账号由 `scripts/seed.mjs` 创建。
- **数据**：时间以毫秒时间戳存储；借阅状态由 `returnedAt` / `dueAt` 推导，不落库。
- **借还**：借出、归还、续借在事务内同时更新 `loan` 与 `book.available_copies`；校验库存、读者状态、重复借阅与逾期。
- **删除**：有借阅历史的图书 / 读者不能删除，只能下架 / 停用。
- **审计**：所有写操作先 `getActor(event)` 取操作者并传入服务层；业务变更与 `recordAudit` 必须在同一事务内，`before/after` 只记录有变化的字段，日期存毫秒时间戳。
- **设置**：`server/settings.ts` 以 key-value JSON 保存，未保存时回落默认值，不做进程内缓存；借阅规则、公告与维护模式都从这里读取，不要在业务代码中硬编码。
- **维护模式**：只拦截借出与续借，归还始终允许；公告与维护提示由 `(app)/+layout.server.ts` 下发。
- **表单**：action 成功返回 `{ ok: true, message }`，失败 `fail(400, { error })`；页面用 `enhanceWithNotification` 统一提示与刷新。
- **UI**：`components/ui/` 是 shadcn 生成代码；业务样式放在上层组件。后台固定浅色，`dark:` 仅在 `.dark` 下生效。
- **列表**：桌面表格 + 移动卡片双视图；表格 `max-height: 56vh`，表头吸顶。
- **SSR**：`vite.config.ts` 保留 `ssr.noExternal: ['bits-ui']`。
- **数据库变更**：改 schema → 新增 `_db/migrate-<说明>.sql` → 同步 `_db/db.sql` 与 `init.sqlite.sql` → `npm run db:push`。

## 提交

完成较大的功能或需求后提交一次，保持每次提交聚焦于一个完整变更。

提交信息使用约定式提交格式 `<type>(<scope>): <英文简述>`，如 `feat(loans): add batch returns`。简述后空一行，描述具体改动的部分。

## 验证

提交前执行 `npm run format` 与 `npm run check`。
