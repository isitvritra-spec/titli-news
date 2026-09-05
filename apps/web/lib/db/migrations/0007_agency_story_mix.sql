INSERT OR IGNORE INTO `sources` (`id`, `name`, `kind`, `url`, `publisher`, `trust_tier`, `source_type`, `ingest_method`, `is_active`)
VALUES
  ('source-bcci', 'BCCI', 'news', 'https://www.bcci.tv', 'Board of Control for Cricket in India', 'primary', 'official', 'manual', true),
  ('source-dst', 'Department of Science and Technology', 'news', 'https://dst.gov.in', 'Government of India', 'primary', 'official', 'manual', true);
--> statement-breakpoint
INSERT OR IGNORE INTO `cards` (`id`, `card_type`, `headline`, `slug`, `body`, `image_path`, `image_alt`, `image_width`, `image_height`, `image_blur_data_url`, `status`, `primary_topic_id`, `published_at`, `reviewed_at`, `updated_at`, `source_id`, `source_date`)
SELECT
  'demo-lakhpati-didi-progress',
  'news',
  'More than 1.48 crore SHG women reached the Lakhpati Didi benchmark',
  'more-than-148-crore-shg-women-reached-lakhpati-didi-benchmark',
  'The Ministry of Rural Development reported in July 2025 that more than 1.48 crore women in self-help-group households had reached the Lakhpati Didi income benchmark. The measure tracks sustained annual household income, not a one-time payment, and sits within a wider rural livelihoods programme.',
  `template`.`image_path`,
  'Abstract editorial illustration for rural women-led enterprise',
  `template`.`image_width`,
  `template`.`image_height`,
  `template`.`image_blur_data_url`,
  'published',
  (SELECT `id` FROM `topics` WHERE `slug` = 'rural-grassroots' LIMIT 1),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'source-pib',
  '2025-07-22'
FROM `cards` AS `template`
LIMIT 1;
--> statement-breakpoint
INSERT OR IGNORE INTO `cards` (`id`, `card_type`, `headline`, `slug`, `body`, `image_path`, `image_alt`, `image_width`, `image_height`, `image_blur_data_url`, `status`, `primary_topic_id`, `published_at`, `reviewed_at`, `updated_at`, `source_id`, `source_date`)
SELECT
  'demo-women-cricket-pay-equity',
  'news',
  'India women cricketers receive equal international match fees',
  'india-women-cricketers-receive-equal-international-match-fees',
  'The BCCI adopted pay equity for international match fees in October 2022. Contracted women players now receive the same match fee as men for Tests, one-day internationals and T20 internationals. The policy does not make every part of cricket pay equal, but it removed one clear difference at international level.',
  `template`.`image_path`,
  'Abstract editorial illustration for women in cricket',
  `template`.`image_width`,
  `template`.`image_height`,
  `template`.`image_blur_data_url`,
  'published',
  (SELECT `id` FROM `topics` WHERE `slug` = 'sports-science-culture' LIMIT 1),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'source-bcci',
  '2022-10-27'
FROM `cards` AS `template`
LIMIT 1;
--> statement-breakpoint
INSERT OR IGNORE INTO `cards` (`id`, `card_type`, `headline`, `slug`, `body`, `image_path`, `image_alt`, `image_width`, `image_height`, `image_blur_data_url`, `status`, `primary_topic_id`, `published_at`, `reviewed_at`, `updated_at`, `source_id`, `source_date`)
SELECT
  'demo-wise-kiran-science-paths',
  'news',
  'A national programme supports women from PhDs to senior research',
  'national-programme-supports-women-from-phds-to-senior-research',
  'The Department of Science and Technology runs WISE-KIRAN programmes for women across different stages of science careers. Its support includes doctoral and post-doctoral fellowships, research opportunities for senior scientists, and institutional work on gender equity. Eligibility and open calls differ by programme, so applicants should check the official portal.',
  `template`.`image_path`,
  'Abstract editorial illustration for women in science',
  `template`.`image_width`,
  `template`.`image_height`,
  `template`.`image_blur_data_url`,
  'published',
  (SELECT `id` FROM `topics` WHERE `slug` = 'sports-science-culture' LIMIT 1),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'source-dst',
  '2026-04-01'
FROM `cards` AS `template`
LIMIT 1;
--> statement-breakpoint
INSERT OR IGNORE INTO `card_topics` (`card_id`, `topic_id`)
SELECT 'demo-lakhpati-didi-progress', `id` FROM `topics` WHERE `slug` IN ('rural-grassroots', 'work-money');
--> statement-breakpoint
INSERT OR IGNORE INTO `card_topics` (`card_id`, `topic_id`)
SELECT 'demo-women-cricket-pay-equity', `id` FROM `topics` WHERE `slug` = 'sports-science-culture';
--> statement-breakpoint
INSERT OR IGNORE INTO `card_topics` (`card_id`, `topic_id`)
SELECT 'demo-wise-kiran-science-paths', `id` FROM `topics` WHERE `slug` IN ('sports-science-culture', 'education-skills');
