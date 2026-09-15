ALTER TABLE `sources` ADD `image_policy` text DEFAULT 'deny' NOT NULL;--> statement-breakpoint
ALTER TABLE `sources` ADD `allows_text_fetch` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `sources` ADD `licence_note` text;--> statement-breakpoint
ALTER TABLE `sources` ADD `attribution_required` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `cards` ADD `image_origin` text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE `cards` ADD `image_credit` text;--> statement-breakpoint
ALTER TABLE `cards` ADD `image_licence` text;--> statement-breakpoint
ALTER TABLE `cards` ADD `image_source_url` text;--> statement-breakpoint
ALTER TABLE `cards` ADD `source_headline` text;--> statement-breakpoint
ALTER TABLE `feed_candidates` ADD `draft_image_origin` text;--> statement-breakpoint
ALTER TABLE `feed_candidates` ADD `draft_image_credit` text;--> statement-breakpoint
UPDATE `sources`
SET `image_policy` = 'allow',
    `allows_text_fetch` = true,
    `attribution_required` = true,
    `licence_note` = 'Government of India press material. Provisionally permitted pending a documented licence read — see the Phase 1 open items.'
WHERE `name` = 'PIB';
