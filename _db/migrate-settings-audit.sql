-- 系统设置与操作审计（可重复执行）

CREATE TABLE IF NOT EXISTS `system_config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_by` integer,
	`updated_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `audit_log` (
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

CREATE INDEX IF NOT EXISTS `idx_audit_log_action` ON `audit_log` (`action`);
CREATE INDEX IF NOT EXISTS `idx_audit_log_created_at` ON `audit_log` (`created_at`);
CREATE INDEX IF NOT EXISTS `idx_audit_log_target` ON `audit_log` (`target_type`, `target_id`);
