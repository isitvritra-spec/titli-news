INSERT OR IGNORE INTO `pulse_metrics`
  (`key`, `kind`, `label`, `value`, `unit`, `period_label`, `source_name`, `source_url`, `methodology`, `sort_order`, `is_active`)
VALUES
  ('women-workforce-participation-2024', 'progress', 'Women in the workforce', 41.7, '% labour-force participation', 'India, 2023-24', 'Periodic Labour Force Survey', 'https://www.mospi.gov.in/publication/annual-report-periodic-labour-force-survey-plfs-july-2023-june-2024', 'Female labour-force participation in usual status, age 15 and above. The rise includes self-employed and unpaid work, so it should not be read as job quality on its own.', 0, true),
  ('rural-women-workforce-2024', 'progress', 'Rural women in the workforce', 35.6, '% participation', 'Rural India, 2023-24', 'Periodic Labour Force Survey', 'https://www.mospi.gov.in/publication/annual-report-periodic-labour-force-survey-plfs-july-2023-june-2024', 'Female labour-force participation in rural India. Economists differ on how much reflects opportunity, necessity, or changes in measurement.', 1, true);
--> statement-breakpoint
UPDATE `pulse_metrics`
SET `sort_order` = 4
WHERE `key` = 'registered-rape-cases-india-2022';
--> statement-breakpoint
CREATE TABLE `_titli_demo_editions` (`edition_id` text PRIMARY KEY NOT NULL);
--> statement-breakpoint
INSERT INTO `_titli_demo_editions` (`edition_id`)
SELECT `ec`.`edition_id`
FROM `edition_cards` AS `ec`
INNER JOIN `cards` AS `c` ON `c`.`id` = `ec`.`card_id`
GROUP BY `ec`.`edition_id`
HAVING COUNT(*) = 7
  AND SUM(CASE WHEN `c`.`slug` = 'the-posh-act-turns-a-decade-old-enforcement-still-lags-in-practice' THEN 1 ELSE 0 END) = 1
  AND SUM(CASE WHEN `c`.`slug` = 'womens-labour-force-participation-jumped-to-417' THEN 1 ELSE 0 END) = 1;
--> statement-breakpoint
DELETE FROM `edition_cards`
WHERE `edition_id` IN (SELECT `edition_id` FROM `_titli_demo_editions`);
--> statement-breakpoint
INSERT INTO `edition_cards` (`edition_id`, `card_id`, `position`, `role`, `recommendation_reason`, `is_mandatory`, `editorial_importance`, `practical_utility`, `distress_level`)
SELECT `d`.`edition_id`, `c`.`id`, 0, 'anchor', 'A progress signal to open the day with agency', true, 100, 75, 'low'
FROM `_titli_demo_editions` AS `d`, `cards` AS `c`
WHERE `c`.`slug` = 'womens-labour-force-participation-jumped-to-417';
--> statement-breakpoint
INSERT INTO `edition_cards` (`edition_id`, `card_id`, `position`, `role`, `recommendation_reason`, `is_mandatory`, `editorial_importance`, `practical_utility`, `distress_level`)
SELECT `d`.`edition_id`, `c`.`id`, 1, 'for_you', 'A workplace conversation with practical relevance', false, 70, 80, 'low'
FROM `_titli_demo_editions` AS `d`, `cards` AS `c`
WHERE `c`.`slug` = 'menstrual-leave-policy-remains-patchy-across-indian-workplaces';
--> statement-breakpoint
INSERT INTO `edition_cards` (`edition_id`, `card_id`, `position`, `role`, `recommendation_reason`, `is_mandatory`, `editorial_importance`, `practical_utility`, `distress_level`)
SELECT `d`.`edition_id`, `c`.`id`, 2, 'number', 'A verified number with the trade-offs kept visible', false, 75, 70, 'low'
FROM `_titli_demo_editions` AS `d`, `cards` AS `c`
WHERE `c`.`slug` = 'rural-womens-workforce-participation-nearly-doubled-in-six-years';
--> statement-breakpoint
INSERT INTO `edition_cards` (`edition_id`, `card_id`, `position`, `role`, `recommendation_reason`, `is_mandatory`, `editorial_importance`, `practical_utility`, `distress_level`)
SELECT `d`.`edition_id`, `c`.`id`, 3, 'useful_now', 'Know where a workplace protection reaches and where it does not', false, 70, 100, 'medium'
FROM `_titli_demo_editions` AS `d`, `cards` AS `c`
WHERE `c`.`slug` = 'maternity-benefit-acts-26-week-leave-rarely-reaches-informal-workers';
--> statement-breakpoint
INSERT INTO `edition_cards` (`edition_id`, `card_id`, `position`, `role`, `recommendation_reason`, `is_mandatory`, `editorial_importance`, `practical_utility`, `distress_level`)
SELECT `d`.`edition_id`, `c`.`id`, 4, 'beyond_metro', 'A grounded story about the women holding public systems together', false, 75, 65, 'low'
FROM `_titli_demo_editions` AS `d`, `cards` AS `c`
WHERE `c`.`slug` = 'anganwadi-and-asha-workers-mostly-women-still-classified-as-volunteers';
--> statement-breakpoint
INSERT INTO `edition_cards` (`edition_id`, `card_id`, `position`, `role`, `recommendation_reason`, `is_mandatory`, `editorial_importance`, `practical_utility`, `distress_level`)
SELECT `d`.`edition_id`, `c`.`id`, 5, 'another_lens', 'A clear view of what the law promises and when it begins', false, 70, 55, 'low'
FROM `_titli_demo_editions` AS `d`, `cards` AS `c`
WHERE `c`.`slug` = 'womens-political-reservation-law-awaits-delimitation-to-take-effect';
--> statement-breakpoint
INSERT INTO `edition_cards` (`edition_id`, `card_id`, `position`, `role`, `recommendation_reason`, `is_mandatory`, `editorial_importance`, `practical_utility`, `distress_level`)
SELECT `d`.`edition_id`, `c`.`id`, 6, 'lift', 'End with measurable progress while keeping the distance left to travel honest', false, 80, 60, 'medium'
FROM `_titli_demo_editions` AS `d`, `cards` AS `c`
WHERE `c`.`slug` = 'child-marriage-before-18-among-women-2024-has-fallen-to-201';
--> statement-breakpoint
DROP TABLE `_titli_demo_editions`;
