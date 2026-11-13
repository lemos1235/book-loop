-- 书循 BookLoop · SQLite 建表脚本（与 drizzle schema 保持一致）
-- 一般无需手工执行：优先使用 npm run db:push；此文件用于查阅或手动初始化。

CREATE TABLE `account` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` integer NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `book` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`isbn` text,
	`category` text DEFAULT '未分类' NOT NULL,
	`publisher` text,
	`published_year` integer,
	`total_copies` integer DEFAULT 1 NOT NULL,
	`available_copies` integer DEFAULT 1 NOT NULL,
	`shelf` text,
	`status` text DEFAULT 'active' NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE TABLE `loan` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`book_id` integer NOT NULL,
	`member_id` integer NOT NULL,
	`borrowed_at` integer NOT NULL,
	`due_at` integer NOT NULL,
	`returned_at` integer,
	`renew_count` integer DEFAULT 0 NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `book`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `member` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_no` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`status` text DEFAULT 'active' NOT NULL,
	`joined_at` integer NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE TABLE `session` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE TABLE `verification` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE TABLE `system_config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_by` integer,
	`updated_at` integer NOT NULL
);

CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`user_email` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`before` text,
	`after` text,
	`ip` text,
	`created_at` integer NOT NULL
);

CREATE INDEX `idx_audit_log_action` ON `audit_log` (`action`);

CREATE INDEX `idx_audit_log_created_at` ON `audit_log` (`created_at`);

CREATE INDEX `idx_audit_log_target` ON `audit_log` (`target_type`,`target_id`);

CREATE INDEX `idx_book_category` ON `book` (`category`);

CREATE INDEX `idx_book_status` ON `book` (`status`);

CREATE INDEX `idx_loan_book_id` ON `loan` (`book_id`);

CREATE INDEX `idx_loan_due_at` ON `loan` (`due_at`);

CREATE INDEX `idx_loan_member_id` ON `loan` (`member_id`);

CREATE INDEX `idx_member_status` ON `member` (`status`);

CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);

CREATE UNIQUE INDEX `uk_book_isbn` ON `book` (`isbn`);

CREATE UNIQUE INDEX `uk_member_member_no` ON `member` (`member_no`);

CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
