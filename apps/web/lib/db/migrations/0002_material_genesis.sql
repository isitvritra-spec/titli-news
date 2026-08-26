CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`installation_id` text NOT NULL,
	`session_id` text NOT NULL,
	`event_type` text NOT NULL,
	`card_id` text,
	`primary_topic_id` text,
	`topic_slug` text,
	`duration_ms` integer,
	`position` integer,
	`occurred_at` text NOT NULL,
	`received_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`primary_topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `analytics_events_occurred_at_idx` ON `analytics_events` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `analytics_events_topic_type_idx` ON `analytics_events` (`primary_topic_id`,`event_type`);--> statement-breakpoint
CREATE INDEX `analytics_events_card_idx` ON `analytics_events` (`card_id`);--> statement-breakpoint
CREATE TABLE `pulse_metrics` (
	`key` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`label` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`period_label` text NOT NULL,
	`source_name` text NOT NULL,
	`source_url` text NOT NULL,
	`methodology` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `cards` ADD `status` text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `cards` ADD `primary_topic_id` text REFERENCES topics(id);--> statement-breakpoint
ALTER TABLE `cards` ADD `reviewed_at` text;--> statement-breakpoint
ALTER TABLE `cards` ADD `updated_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `sources` ADD `trust_tier` text DEFAULT 'trusted' NOT NULL;--> statement-breakpoint
ALTER TABLE `sources` ADD `source_type` text DEFAULT 'mainstream' NOT NULL;--> statement-breakpoint
ALTER TABLE `sources` ADD `feed_url` text;--> statement-breakpoint
ALTER TABLE `sources` ADD `ingest_method` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `sources` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `sources` ADD `editorial_notes` text;--> statement-breakpoint
INSERT INTO `sources` (`id`, `name`, `kind`, `url`, `publisher`, `trust_tier`, `source_type`, `feed_url`, `ingest_method`)
SELECT 'source-nfhs', 'NFHS', 'data', 'https://www.nfhsiips.in', 'Ministry of Health and Family Welfare', 'primary', 'official', NULL, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM `sources` WHERE `name` = 'NFHS')
UNION ALL SELECT 'source-plfs', 'PLFS', 'data', 'https://www.mospi.gov.in', 'Ministry of Statistics and Programme Implementation', 'primary', 'official', NULL, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM `sources` WHERE `name` = 'PLFS')
UNION ALL SELECT 'source-fii', 'Feminism in India', 'news', 'https://feminisminindia.com', NULL, 'trusted', 'specialist', 'https://feminisminindia.com/feed/', 'rss'
WHERE NOT EXISTS (SELECT 1 FROM `sources` WHERE `name` = 'Feminism in India')
UNION ALL SELECT 'source-behanbox', 'BehanBox', 'news', 'https://behanbox.com', NULL, 'trusted', 'specialist', 'https://behanbox.com/feed/', 'rss'
WHERE NOT EXISTS (SELECT 1 FROM `sources` WHERE `name` IN ('BehanBox', 'Behanbox'))
UNION ALL SELECT 'source-isignal', 'ISignal', 'news', 'https://www.isignal.in', NULL, 'trusted', 'data', 'https://www.isignal.in/feeds.xml', 'rss'
WHERE NOT EXISTS (SELECT 1 FROM `sources` WHERE `name` IN ('ISignal', 'IndiaSpend', 'IndiaSpend (ISignal)'))
UNION ALL SELECT 'source-the-hindu', 'The Hindu', 'news', 'https://www.thehindu.com', NULL, 'trusted', 'mainstream', 'https://www.thehindu.com/society/feeder/default.rss', 'rss'
WHERE NOT EXISTS (SELECT 1 FROM `sources` WHERE `name` = 'The Hindu')
UNION ALL SELECT 'source-scroll', 'Scroll.in', 'news', 'https://scroll.in', NULL, 'trusted', 'mainstream', 'https://feeds.feedburner.com/ScrollinArticles.rss', 'rss'
WHERE NOT EXISTS (SELECT 1 FROM `sources` WHERE `name` = 'Scroll.in')
UNION ALL SELECT 'source-pib', 'PIB', 'news', 'https://pib.gov.in', NULL, 'primary', 'official', 'https://archive.pib.gov.in/newsite/rssenglish.aspx', 'rss'
WHERE NOT EXISTS (SELECT 1 FROM `sources` WHERE `name` = 'PIB')
UNION ALL SELECT 'source-khabar-lahariya', 'Khabar Lahariya', 'news', 'https://khabarlahariya.org', NULL, 'trusted', 'specialist', 'https://khabarlahariya.org/feed/', 'rss'
WHERE NOT EXISTS (SELECT 1 FROM `sources` WHERE `name` = 'Khabar Lahariya')
UNION ALL SELECT 'source-google-news', 'Google News', 'news', 'https://news.google.com', NULL, 'discovery', 'aggregator', NULL, 'rss'
WHERE NOT EXISTS (SELECT 1 FROM `sources` WHERE `name` = 'Google News');--> statement-breakpoint
UPDATE `sources` SET `name` = 'BehanBox', `trust_tier` = 'trusted', `source_type` = 'specialist', `feed_url` = 'https://behanbox.com/feed/', `ingest_method` = 'rss' WHERE `name` = 'Behanbox';--> statement-breakpoint
UPDATE `sources` SET `name` = 'ISignal', `url` = 'https://www.isignal.in', `trust_tier` = 'trusted', `source_type` = 'data', `feed_url` = 'https://www.isignal.in/feeds.xml', `ingest_method` = 'rss' WHERE `name` IN ('IndiaSpend', 'IndiaSpend (ISignal)');--> statement-breakpoint
INSERT OR IGNORE INTO `topics` (`id`, `title`, `slug`, `short_description`, `sort_order`, `is_active`) VALUES
	('genre-health-wellness', 'Health & Wellness', 'health-wellness', 'Physical, reproductive and mental wellbeing', 0, true),
	('genre-safety-justice', 'Safety & Justice', 'safety-justice', 'Safety, violence, policing and justice', 1, true),
	('genre-work-money', 'Work & Money', 'work-money', 'Jobs, wages, business and financial independence', 2, true),
	('genre-rights-policy', 'Rights & Policy', 'rights-policy', 'Laws, courts and schemes affecting women', 3, true),
	('genre-education-skills', 'Education & Skills', 'education-skills', 'Learning, training and opportunity', 4, true),
	('genre-womens-wins', 'Women''s Wins', 'womens-wins', 'Verified achievements by women across India', 5, true),
	('genre-rural-grassroots', 'Rural & Grassroots', 'rural-grassroots', 'Women-led change beyond metropolitan India', 6, true),
	('genre-sports-science-culture', 'Sports, Science & Culture', 'sports-science-culture', 'Women shaping sport, research and culture', 7, true);--> statement-breakpoint
UPDATE `cards`
SET `primary_topic_id` = (
	SELECT `card_topics`.`topic_id`
	FROM `card_topics`
	WHERE `card_topics`.`card_id` = `cards`.`id`
	LIMIT 1
)
WHERE `primary_topic_id` IS NULL;--> statement-breakpoint
UPDATE `cards`
SET `updated_at` = `created_at`
WHERE `updated_at` = '';--> statement-breakpoint
INSERT OR IGNORE INTO `pulse_metrics`
	(`key`, `kind`, `label`, `value`, `unit`, `period_label`, `source_name`, `source_url`, `methodology`, `sort_order`, `is_active`)
VALUES
	('registered-rape-cases-india-2022', 'safety', 'Reported rape cases', 31516, 'cases registered', 'India, 2022', 'National Crime Records Bureau', 'https://www.mha.gov.in/sites/default/files/AnnualReport_27122024.pdf', 'Annual cases registered by police and reported by NCRB. This is not a live incident counter and does not measure unreported violence.', 0, true);
