-- 书循 BookLoop · 数据库结构参考（MySQL 语法，仅用于设计查阅）
-- 实际运行使用 SQLite，见 _db/init.sqlite.sql 与 drizzle schema。


-- 用户（Better Auth）
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`
(
    id             BIGINT       NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name           VARCHAR(128) NOT NULL COMMENT '显示名称',
    email          VARCHAR(255) NOT NULL COMMENT '登录邮箱',
    email_verified TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '邮箱是否已验证（本项目不发验证邮件，固定为 0）',
    image          TEXT         NULL COMMENT '头像地址',
    created_at     DATETIME(3)  NOT NULL,
    updated_at     DATETIME(3)  NOT NULL,
    UNIQUE INDEX uk_email (email)
) COMMENT = '用户';

-- 会话（Better Auth）
DROP TABLE IF EXISTS `session`;
CREATE TABLE `session`
(
    id         BIGINT       NOT NULL PRIMARY KEY AUTO_INCREMENT,
    user_id    BIGINT       NOT NULL COMMENT '用户ID',
    token      VARCHAR(255) NOT NULL COMMENT '会话 Token',
    expires_at DATETIME(3)  NOT NULL COMMENT '过期时间',
    ip_address VARCHAR(45)  NULL COMMENT '客户端 IP',
    user_agent TEXT         NULL COMMENT '客户端 User Agent',
    created_at DATETIME(3)  NOT NULL,
    updated_at DATETIME(3)  NOT NULL,
    UNIQUE INDEX uk_token (token),
    INDEX idx_session_user_id (user_id),
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
) COMMENT = '登录会话';

-- 认证账户（邮箱密码凭据）
DROP TABLE IF EXISTS `account`;
CREATE TABLE `account`
(
    id                       BIGINT       NOT NULL PRIMARY KEY AUTO_INCREMENT,
    user_id                  BIGINT       NOT NULL COMMENT '用户ID',
    account_id               VARCHAR(255) NOT NULL COMMENT '认证账户标识（凭据登录时等于用户ID）',
    provider_id              VARCHAR(64)  NOT NULL COMMENT '认证方式（本项目固定为 credential）',
    access_token             TEXT         NULL COMMENT '访问令牌',
    refresh_token            TEXT         NULL COMMENT '刷新令牌',
    id_token                 TEXT         NULL COMMENT 'ID 令牌',
    access_token_expires_at  DATETIME(3)  NULL COMMENT '访问令牌过期时间',
    refresh_token_expires_at DATETIME(3)  NULL COMMENT '刷新令牌过期时间',
    scope                    TEXT         NULL COMMENT '授权范围',
    password                 VARCHAR(255) NULL COMMENT '密码哈希（Better Auth scrypt）',
    created_at               DATETIME(3)  NOT NULL,
    updated_at               DATETIME(3)  NOT NULL,
    INDEX idx_account_user_id (user_id),
    CONSTRAINT fk_account_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
) COMMENT = '认证账户';

-- 验证记录（Better Auth 标准表，本项目不发送邮件，保留以兼容框架）
DROP TABLE IF EXISTS `verification`;
CREATE TABLE `verification`
(
    id         BIGINT       NOT NULL PRIMARY KEY AUTO_INCREMENT,
    identifier VARCHAR(255) NOT NULL COMMENT '验证标识',
    value      TEXT         NOT NULL COMMENT '验证值',
    expires_at DATETIME(3)  NOT NULL COMMENT '过期时间',
    created_at DATETIME(3)  NOT NULL,
    updated_at DATETIME(3)  NOT NULL
) COMMENT = '验证记录';

-- 图书
DROP TABLE IF EXISTS `book`;
CREATE TABLE `book`
(
    id               BIGINT       NOT NULL PRIMARY KEY AUTO_INCREMENT,
    title            VARCHAR(80)  NOT NULL COMMENT '书名',
    author           VARCHAR(60)  NOT NULL COMMENT '作者',
    isbn             VARCHAR(32)  NULL COMMENT 'ISBN（可为空，非空时唯一）',
    category         VARCHAR(20)  NOT NULL DEFAULT '未分类' COMMENT '分类',
    publisher        VARCHAR(60)  NULL COMMENT '出版社',
    published_year   INT          NULL COMMENT '出版年份',
    total_copies     INT          NOT NULL DEFAULT 1 COMMENT '馆藏总册数',
    available_copies INT          NOT NULL DEFAULT 1 COMMENT '当前可借册数（随借还变化）',
    shelf            VARCHAR(30)  NULL COMMENT '书架位置',
    status           VARCHAR(16)  NOT NULL DEFAULT 'active' COMMENT '状态（active: 在架, archived: 已下架）',
    note             VARCHAR(300) NULL COMMENT '备注',
    created_at       DATETIME(3)  NOT NULL,
    updated_at       DATETIME(3)  NOT NULL,
    UNIQUE INDEX uk_book_isbn (isbn),
    INDEX idx_book_category (category),
    INDEX idx_book_status (status)
) COMMENT = '图书';

-- 读者
DROP TABLE IF EXISTS `member`;
CREATE TABLE `member`
(
    id         BIGINT       NOT NULL PRIMARY KEY AUTO_INCREMENT,
    member_no  VARCHAR(20)  NOT NULL COMMENT '读者编号（M-YYYY-0001）',
    name       VARCHAR(40)  NOT NULL COMMENT '姓名',
    phone      VARCHAR(20)  NULL COMMENT '手机号',
    email      VARCHAR(80)  NULL COMMENT '邮箱',
    status     VARCHAR(16)  NOT NULL DEFAULT 'active' COMMENT '状态（active: 正常, suspended: 已停用）',
    joined_at  DATETIME(3)  NOT NULL COMMENT '加入时间',
    note       VARCHAR(300) NULL COMMENT '备注',
    created_at DATETIME(3)  NOT NULL,
    updated_at DATETIME(3)  NOT NULL,
    UNIQUE INDEX uk_member_no (member_no),
    INDEX idx_member_status (status)
) COMMENT = '读者';

-- 借阅记录
DROP TABLE IF EXISTS `loan`;
CREATE TABLE `loan`
(
    id          BIGINT       NOT NULL PRIMARY KEY AUTO_INCREMENT,
    book_id     BIGINT       NOT NULL COMMENT '图书ID',
    member_id   BIGINT       NOT NULL COMMENT '读者ID',
    borrowed_at DATETIME(3)  NOT NULL COMMENT '借出时间',
    due_at      DATETIME(3)  NOT NULL COMMENT '应还时间',
    returned_at DATETIME(3)  NULL COMMENT '归还时间（为空表示未归还）',
    renew_count INT          NOT NULL DEFAULT 0 COMMENT '已续借次数',
    note        VARCHAR(300) NULL COMMENT '备注',
    created_at  DATETIME(3)  NOT NULL,
    updated_at  DATETIME(3)  NOT NULL,
    INDEX idx_loan_book_id (book_id),
    INDEX idx_loan_member_id (member_id),
    INDEX idx_loan_due_at (due_at),
    CONSTRAINT fk_loan_book FOREIGN KEY (book_id) REFERENCES `book` (id),
    CONSTRAINT fk_loan_member FOREIGN KEY (member_id) REFERENCES `member` (id)
) COMMENT = '借阅记录';

-- 系统设置（key-value，值为 JSON）
DROP TABLE IF EXISTS `system_config`;
CREATE TABLE `system_config`
(
    `key`        VARCHAR(64)  NOT NULL PRIMARY KEY COMMENT '设置键：loan.rules / announcement / maintenance',
    `value`      JSON         NOT NULL COMMENT '设置值（JSON）',
    `updated_by` BIGINT       NULL COMMENT '最后修改人用户ID',
    `updated_at` DATETIME(3)  NOT NULL COMMENT '最后修改时间'
) COMMENT = '系统设置';

-- 操作审计日志（只增不改）
DROP TABLE IF EXISTS `audit_log`;
CREATE TABLE `audit_log`
(
    id          BIGINT       NOT NULL PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL COMMENT '操作者用户ID',
    user_email  VARCHAR(255) NOT NULL COMMENT '操作者邮箱快照',
    action      VARCHAR(64)  NOT NULL COMMENT '动作，见 src/lib/audit.ts',
    target_type VARCHAR(32)  NOT NULL COMMENT '目标类型：book/member/loan/setting',
    target_id   VARCHAR(64)  NOT NULL COMMENT '目标ID或设置键',
    `before`    JSON         NULL COMMENT '变更前快照',
    `after`     JSON         NULL COMMENT '变更后快照',
    ip          VARCHAR(45)  NULL COMMENT '客户端IP',
    created_at  DATETIME(3)  NOT NULL COMMENT '发生时间',
    INDEX idx_audit_log_action (action),
    INDEX idx_audit_log_target (target_type, target_id),
    INDEX idx_audit_log_created_at (created_at)
) COMMENT = '操作审计日志';
