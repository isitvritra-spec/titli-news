UPDATE `editions`
SET `version` = `version` + 1,
    `updated_at` = CURRENT_TIMESTAMP
WHERE `id` IN (
  SELECT `ec`.`edition_id`
  FROM `edition_cards` AS `ec`
  INNER JOIN `cards` AS `c` ON `c`.`id` = `ec`.`card_id`
  WHERE `ec`.`position` = 0
    AND `ec`.`role` = 'anchor'
    AND `c`.`slug` = 'womens-labour-force-participation-jumped-to-417'
);
