# 书循 BookLoop

一个简洁的图书借还管理后台，用于管理馆藏、读者与借阅流转，支持桌面和手机访问。

## 功能

- **工作台**：馆藏、在借、逾期与读者统计；近 7 日借还趋势；逾期提醒。
- **图书管理**：新增、编辑、上下架、删除；按书名、作者、ISBN、分类筛选。
- **读者管理**：登记读者、编辑资料、停用启用、删除；读者详情页展示资料、在借与历史借阅、操作记录。
- **借阅管理**：登记借阅、续借、归还；按在借、逾期、已归还筛选。
- **系统设置**：配置默认借期、续借规则与逾期禁借；发布站点公告；开启维护模式暂停借出与续借。
- **审计日志**：记录图书、读者、借阅与设置的全部写操作，支持按动作筛选与分页查看变更前后内容。
- **移动端**：列表自动切换为卡片视图，操作按钮与弹窗适配手机屏幕。

## 快速开始

要求 Node.js 22 及以上。

```bash
npm install

cp .env.example .env
# 打开 .env，为 BETTER_AUTH_SECRET 填一段至少 32 位的随机字符串

npm run db:push
npm run db:seed
npm run dev
```

打开 <http://localhost:15173> 即可登录。

种子脚本会创建演示账号和一批示例图书、读者与借阅记录。

## 登录账号

```text
邮箱：admin@bookloop.local
密码：bookloop123
```

正式使用前请修改密码：

```bash
npm run user:password -- admin@bookloop.local 新密码
```

## 常用命令

| 命令                                       | 说明                   |
| ------------------------------------------ | ---------------------- |
| `npm run dev`                              | 启动开发服务器         |
| `npm run build`                            | 构建生产版本           |
| `npm start`                                | 运行生产版本           |
| `npm run db:push`                          | 初始化或同步数据库     |
| `npm run db:seed`                          | 创建默认账号与演示数据 |
| `npm run user:password -- <邮箱> <新密码>` | 修改登录密码           |
| `npm run format`                           | 自动格式化代码         |

## 部署

```bash
npm install
npm run build
ORIGIN=https://你的域名 BETTER_AUTH_SECRET=你的密钥 node build
```

将 `ORIGIN` 设置为浏览器实际访问的地址。

## 更多

- 开发约定与技术细节见 [AGENTS.md](AGENTS.md)。
- 数据库结构与迁移说明见 [_db/README.md](_db/README.md)。
