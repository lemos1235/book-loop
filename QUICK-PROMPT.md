# 书循 BookLoop · 快速初始化指令

参考 `book-loop` 仓库初始化一个独立、可运行的新项目。技术选型、目录结构、主题风格、工程约定和常用命令，全部以该仓库的 `AGENTS.md` 和实际代码为准，不要自行发挥。业务方向以用户消息为准（例如「账本管理项目」）；项目名称从中推断，目录名用英文 kebab-case。

参考仓库：<https://github.com/lemos1235/book-loop>

## 先问清业务需求

用户消息没有说明时，开工前一次性问清楚，不要反复追问：

1. 这个系统主要用来做什么？
2. 你希望在里面管理哪些东西？每样东西需要记录哪些信息？
3. 你平时会用它做哪些事？
4. 有没有特别的要求？

用户是小白：提问用日常用语，给出 2～3 个常见选项或例子帮助选择，不要用技术术语；用户说不清时，直接给出推荐做法并请其确认。

项目名称、存放目录等非业务信息从用户消息推断或直接询问。用户没有要求的部分，登录、工作台、列表增删改查、分页筛选等沿用参考项目。

## 读取参考项目

1. 本地已有 `book-loop` 就直接读取，否则克隆到临时目录，不要克隆进新项目。
2. 必须先读 `AGENTS.md`、`README.md`、`package.json`、`components.json`、`src/app.css`，再按 `AGENTS.md` 的目录树了解 `src/lib/server/`、`src/routes/` 等代码。
3. 无法访问仓库时，停止并请用户提供本地路径，不要凭印象编造结构。

## 执行步骤

1. 按参考项目的技术栈和目录结构初始化 SvelteKit 项目，包括 `_db/`、`scripts/`、`src/lib/components/ui/`、`components.json`、`AGENTS.md`、`README.md`、`.env.example`、`.gitignore` 等。
2. 沿用参考项目的主题、组件、表单校验、通知与移动端适配。
3. 保留登录、工作台、列表增删改查等通用骨架，把图书 / 读者 / 借阅替换成用户指定的业务；不保留无关模块。
4. 为新项目重写 `README.md` 和 `AGENTS.md`，内容匹配新项目，不要照抄参考项目的业务描述。
5. 配置 `.env.example`、数据库与种子脚本；沿用固定邮箱登录时，种子脚本创建默认管理员。
6. 根据 `.env.example` 创建 `.env`，为 `BETTER_AUTH_SECRET` 生成至少 32 位的随机字符串；`.env` 不提交。
7. 执行 `npm install`、`npm run format`、`npm run check`、`npm run db:push`、`npm run db:seed`，并启动一次开发服务器确认可访问；有报错就修复后重跑。
8. 从参考项目复制 `.claude/skills/dev-runner/` 到新项目，用 `claude plugin list` 确认显示 `dev-runner@skills-dir`（Scope 为 project）。
9. 确认 `.gitignore` 已忽略 `node_modules`、`.env`、`*.db` 和构建产物，然后提交一次。

## 硬性要求

- 细节一律以参考项目的 `AGENTS.md` 和实际代码为准；与用户明确要求冲突时，以用户要求为准。
- 不复制与用户业务无关的页面、模型和脚本。
- 不提交真实密钥、数据库文件或 `.env`。
- 复制参考项目的 `.claude/skills/dev-runner/` 插件。
- 不在新项目中复制 `QUICK-PROMPT.md` 或 `PROMPT-GUIDE.md`。
- 界面文案使用中文。

## 汇报

用非技术人员能看懂的话说明：项目目录与功能、启动方式和访问地址、默认账号与改密方式、各项验证结果、还需用户确认的事项。
