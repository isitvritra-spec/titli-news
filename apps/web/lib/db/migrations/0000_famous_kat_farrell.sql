CREATE TABLE `card_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`year` integer NOT NULL,
	`value` real NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `card_state_breakdown` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`state` text NOT NULL,
	`value` real NOT NULL,
	`year` integer,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `card_topics` (
	`card_id` text NOT NULL,
	`topic_id` text NOT NULL,
	PRIMARY KEY(`card_id`, `topic_id`),
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`card_type` text NOT NULL,
	`headline` text NOT NULL,
	`slug` text NOT NULL,
	`body` text NOT NULL,
	`image_path` text NOT NULL,
	`image_alt` text NOT NULL,
	`image_width` integer NOT NULL,
	`image_height` integer NOT NULL,
	`image_blur_data_url` text NOT NULL,
	`published_at` text NOT NULL,
	`is_contested` integer DEFAULT false NOT NULL,
	`contested_note` text,
	`deep_dive_body` text,
	`source_id` text,
	`source_date` text,
	`metric_value` real,
	`metric_unit` text,
	`survey_source_id` text,
	`methodology_note` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`survey_source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cards_slug_unique` ON `cards` (`slug`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`url` text NOT NULL,
	`publisher` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`short_description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `topics_slug_unique` ON `topics` (`slug`);