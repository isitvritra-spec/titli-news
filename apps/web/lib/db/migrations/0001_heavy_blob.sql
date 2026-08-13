CREATE TABLE `feed_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`source_name` text NOT NULL,
	`source_site_url` text NOT NULL,
	`title` text NOT NULL,
	`link` text NOT NULL,
	`image_url` text,
	`pub_date` text,
	`fetched_at` text DEFAULT (current_timestamp) NOT NULL,
	`dismissed` integer DEFAULT false NOT NULL,
	`draft_image_path` text,
	`draft_image_alt` text,
	`draft_image_width` integer,
	`draft_image_height` integer,
	`draft_image_blur_data_url` text,
	`drafted_card_id` text,
	FOREIGN KEY (`drafted_card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feed_candidates_link_unique` ON `feed_candidates` (`link`);