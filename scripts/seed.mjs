/**
 * 初始化固定管理员账号与演示数据。
 * 使用方式：先 `npm run db:push` 建表，再 `npm run db:seed`。
 * 脚本可重复执行：账号已存在、图书已有数据时会跳过对应部分。
 */
import Database from 'better-sqlite3';
import { hashPassword } from 'better-auth/crypto';

const DATABASE_URL = process.env.DATABASE_URL || 'local.db';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@bookloop.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'bookloop123';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || '管理员';

const DAY = 86_400_000;
const now = Date.now();
const daysAgo = (days) => now - days * DAY;

const db = new Database(DATABASE_URL);

const tables = db
  .prepare(
    "select name from sqlite_master where type = 'table' and name in ('user', 'book', 'member', 'loan')",
  )
  .all()
  .map((row) => row.name);
if (!['user', 'book', 'member', 'loan'].every((name) => tables.includes(name))) {
  console.error('数据库表尚未创建，请先运行：npm run db:push');
  process.exit(1);
}

async function seedAdmin() {
  const existing = db.prepare('select id from user where email = ?').get(ADMIN_EMAIL);
  if (existing) {
    console.log(`管理员账号已存在：${ADMIN_EMAIL}`);
    return;
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  const result = db
    .prepare(
      `insert into user (name, email, email_verified, created_at, updated_at)
       values (?, ?, 0, ?, ?)`,
    )
    .run(ADMIN_NAME, ADMIN_EMAIL, now, now);

  db.prepare(
    `insert into account (account_id, provider_id, user_id, password, created_at, updated_at)
     values (?, 'credential', ?, ?, ?, ?)`,
  ).run(String(result.lastInsertRowid), result.lastInsertRowid, passwordHash, now, now);

  console.log(`已创建固定管理员：${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

const BOOKS = [
  ['活着', '余华', '9787506365437', '文学', '作家出版社', 2012, 5, 'A-01-01'],
  ['百年孤独', '加西亚·马尔克斯', '9787544253994', '文学', '南海出版公司', 2011, 4, 'A-01-02'],
  ['月亮与六便士', '毛姆', '9787532747627', '文学', '上海译文出版社', 2009, 3, 'A-01-03'],
  ['人类简史', '尤瓦尔·赫拉利', '9787508647357', '历史', '中信出版社', 2014, 3, 'B-02-01'],
  ['万历十五年', '黄仁宇', '9787101054491', '历史', '中华书局', 2007, 3, 'B-02-02'],
  ['三体', '刘慈欣', '9787536692930', '科幻', '重庆出版社', 2008, 6, 'C-01-01'],
  [
    '深入理解计算机系统',
    'Randal E. Bryant',
    '9787111544937',
    '科技',
    '机械工业出版社',
    2016,
    2,
    'C-02-01',
  ],
  [
    '代码整洁之道',
    'Robert C. Martin',
    '9787115216878',
    '科技',
    '人民邮电出版社',
    2010,
    3,
    'C-02-02',
  ],
  ['数学之美', '吴军', '9787115373557', '科技', '人民邮电出版社', 2014, 2, 'C-02-03'],
  ['设计中的设计', '原研哉', '9787209040310', '艺术', '山东人民出版社', 2006, 2, 'D-01-01'],
  ['小王子', '圣埃克苏佩里', '9787020042494', '少儿', '人民文学出版社', 2003, 4, 'E-01-01'],
  ['窗边的小豆豆', '黑柳彻子', '9787544250580', '少儿', '南海出版公司', 2011, 3, 'E-01-02'],
  ['管理的实践', '彼得·德鲁克', '9787111270782', '管理', '机械工业出版社', 2009, 2, 'F-01-01'],
  ['原则', '瑞·达利欧', '9787508684031', '管理', '中信出版社', 2018, 3, 'F-01-02'],
];

const MEMBERS = [
  ['M-2026-0001', '林晓', '13800000001', 'linxiao@example.com', 'active'],
  ['M-2026-0002', '陈念', '13800000002', 'chennian@example.com', 'active'],
  ['M-2026-0003', '周舟', '13800000003', 'zhouzhou@example.com', 'active'],
  ['M-2026-0004', '苏禾', '13800000004', 'suhe@example.com', 'active'],
  ['M-2026-0005', '何一', '13800000005', 'heyi@example.com', 'suspended'],
  ['M-2026-0006', '顾言', '13800000006', 'guyan@example.com', 'active'],
  ['M-2026-0007', '江屿', '13800000007', 'jiangyu@example.com', 'active'],
  ['M-2026-0008', '沈知', '13800000008', 'shenzhi@example.com', 'active'],
];

// [图书下标, 读者下标, 借出天数前, 是否已还, 归还天数前, 续借次数]
const LOANS = [
  [5, 0, 5, false, null, 0],
  [3, 1, 12, false, null, 0],
  [7, 2, 2, false, null, 1],
  [1, 3, 45, false, null, 0],
  [10, 5, 50, false, null, 0],
  [0, 0, 40, true, 10, 0],
  [4, 2, 30, true, 12, 0],
  [11, 1, 20, true, 6, 0],
  [2, 6, 8, true, 1, 0],
  [6, 5, 60, true, 30, 0],
];

function seedBusinessData() {
  const bookCount = db.prepare('select count(*) as count from book').get().count;
  if (bookCount > 0) {
    console.log(`图书表已有 ${bookCount} 条数据，跳过演示数据。`);
    return;
  }

  const insertBook = db.prepare(
    `insert into book (title, author, isbn, category, publisher, published_year,
       total_copies, available_copies, shelf, status, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
  );
  const bookIds = BOOKS.map((row) => {
    const [title, author, isbn, category, publisher, year, total, shelf] = row;
    const result = insertBook.run(
      title,
      author,
      isbn,
      category,
      publisher,
      year,
      total,
      total,
      shelf,
      daysAgo(90),
      daysAgo(90),
    );
    return result.lastInsertRowid;
  });

  const insertMember = db.prepare(
    `insert into member (member_no, name, phone, email, status, joined_at, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const memberIds = MEMBERS.map((row) => {
    const result = insertMember.run(...row, daysAgo(80), daysAgo(80), daysAgo(80));
    return result.lastInsertRowid;
  });

  const insertLoan = db.prepare(
    `insert into loan (book_id, member_id, borrowed_at, due_at, returned_at, renew_count,
       created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const decrementBook = db.prepare(
    'update book set available_copies = available_copies - 1 where id = ?',
  );

  for (const [
    bookIndex,
    memberIndex,
    borrowedDaysAgo,
    returned,
    returnedDaysAgo,
    renewCount,
  ] of LOANS) {
    const bookId = bookIds[bookIndex];
    const memberId = memberIds[memberIndex];
    const borrowedAt = daysAgo(borrowedDaysAgo);
    const dueAt = borrowedAt + 30 * DAY;
    const returnedAt = returned ? daysAgo(returnedDaysAgo) : null;
    insertLoan.run(
      bookId,
      memberId,
      borrowedAt,
      dueAt,
      returnedAt,
      renewCount,
      borrowedAt,
      returnedAt ?? borrowedAt,
    );
    if (!returned) decrementBook.run(bookId);
  }

  console.log(
    `已写入 ${BOOKS.length} 本图书、${MEMBERS.length} 位读者、${LOANS.length} 条借阅记录。`,
  );
}

await seedAdmin();
seedBusinessData();
db.close();
