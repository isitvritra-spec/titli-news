CREATE TABLE `story_clusters` (
	`id` text PRIMARY KEY NOT NULL,
	`canonical_title` text NOT NULL,
	`canonical_candidate_id` text,
	`topic_guess` text,
	`relevance_score` real,
	`outlet_count` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`first_seen_at` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `feed_candidates` ADD `status` text DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE `feed_candidates` ADD `cluster_id` text REFERENCES `story_clusters`(`id`) ON DELETE set null;--> statement-breakpoint
ALTER TABLE `feed_candidates` ADD `relevance_score` real;--> statement-breakpoint
CREATE INDEX `feed_candidates_status_idx` ON `feed_candidates` (`status`);--> statement-breakpoint
CREATE INDEX `feed_candidates_cluster_idx` ON `feed_candidates` (`cluster_id`);--> statement-breakpoint
UPDATE `feed_candidates` SET `status` = 'dismissed' WHERE `dismissed` = true;--> statement-breakpoint
UPDATE `feed_candidates` SET `status` = 'drafted' WHERE `drafted_card_id` IS NOT NULL;
