CREATE TABLE `admin_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text DEFAULT 'editor' NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`detail` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_actions_created_idx` ON `admin_actions` (`created_at`);--> statement-breakpoint
ALTER TABLE `cards` ADD `created_by` text;--> statement-breakpoint
ALTER TABLE `cards` ADD `approved_by` text;
