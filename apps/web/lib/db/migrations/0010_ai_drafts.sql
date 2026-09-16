ALTER TABLE `cards` ADD `ai_generated` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `cards` ADD `ai_reviewed` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `cards` ADD `originality_max_run` integer;--> statement-breakpoint
ALTER TABLE `cards` ADD `originality_spans` text;
