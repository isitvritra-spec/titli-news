CREATE TABLE `edition_cards` (
	`edition_id` text NOT NULL,
	`card_id` text NOT NULL,
	`position` integer NOT NULL,
	`role` text NOT NULL,
	`recommendation_reason` text NOT NULL,
	`is_mandatory` integer DEFAULT false NOT NULL,
	`editorial_importance` integer DEFAULT 50 NOT NULL,
	`practical_utility` integer DEFAULT 50 NOT NULL,
	`distress_level` text DEFAULT 'low' NOT NULL,
	PRIMARY KEY(`edition_id`, `card_id`),
	FOREIGN KEY (`edition_id`) REFERENCES `editions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `edition_cards_position_idx` ON `edition_cards` (`edition_id`,`position`);--> statement-breakpoint
CREATE TABLE `editions` (
	`id` text PRIMARY KEY NOT NULL,
	`edition_date` text NOT NULL,
	`timezone` text DEFAULT 'Asia/Kolkata' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`scheduled_for` text,
	`published_at` text,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `editions_edition_date_unique` ON `editions` (`edition_date`);--> statement-breakpoint
ALTER TABLE `analytics_events` ADD `edition_id` text REFERENCES editions(id);--> statement-breakpoint
CREATE INDEX `analytics_events_edition_idx` ON `analytics_events` (`edition_id`,`event_type`);