-- ═══════════════════════════════════════════════════════════════════════
-- SAFE, IDEMPOTENT production schema catch-up script.
-- Run this ENTIRE file as one batch (MySQL Workbench: open file, Ctrl+Shift+Enter
-- "Execute all"). Unlike apply_pending_prod_schema.sql, this checks
-- INFORMATION_SCHEMA before every ALTER, so already-applied columns are
-- skipped instead of erroring out and halting the batch. Safe to re-run
-- any number of times.
--
-- Covers every change under database/*.sql as of 2026-08-22:
--   tbl_schools: intro_message_enabled, footer_bg_url, bg_music_enabled,
--                bg_music_track, affiliation_badges, custom_domain,
--                prospectus_url, whatsapp_number
--   tbl_enquiries: full table (Admission/Career enquiry modules)
-- ═══════════════════════════════════════════════════════════════════════

DELIMITER $$

DROP PROCEDURE IF EXISTS _add_column_if_missing $$
CREATE PROCEDURE _add_column_if_missing(
  IN p_table VARCHAR(64),
  IN p_column VARCHAR(64),
  IN p_definition VARCHAR(500)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table
      AND COLUMN_NAME = p_column
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN ', p_definition);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    SELECT CONCAT('ADDED: ', p_table, '.', p_column) AS result;
  ELSE
    SELECT CONCAT('SKIPPED (already exists): ', p_table, '.', p_column) AS result;
  END IF;
END $$

DELIMITER ;

CALL _add_column_if_missing('tbl_schools', 'intro_message_enabled', '`intro_message_enabled` TINYINT(1) NOT NULL DEFAULT 1 AFTER `intro_message`');
CALL _add_column_if_missing('tbl_schools', 'footer_bg_url', '`footer_bg_url` VARCHAR(500) NULL AFTER `welcome_banner_link`');
CALL _add_column_if_missing('tbl_schools', 'bg_music_enabled', '`bg_music_enabled` TINYINT(1) NOT NULL DEFAULT 0 AFTER `footer_bg_url`');
CALL _add_column_if_missing('tbl_schools', 'bg_music_track', '`bg_music_track` VARCHAR(50) NULL AFTER `bg_music_enabled`');
CALL _add_column_if_missing('tbl_schools', 'affiliation_badges', '`affiliation_badges` JSON NULL AFTER `bg_music_track`');
CALL _add_column_if_missing('tbl_schools', 'custom_domain', '`custom_domain` VARCHAR(255) NULL AFTER `affiliation_badges`');
CALL _add_column_if_missing('tbl_schools', 'prospectus_url', '`prospectus_url` VARCHAR(500) NULL AFTER `custom_domain`');
CALL _add_column_if_missing('tbl_schools', 'whatsapp_number', '`whatsapp_number` VARCHAR(20) NULL AFTER `phone2`');

CREATE TABLE IF NOT EXISTS tbl_enquiries (
  id INT NOT NULL AUTO_INCREMENT,
  uuid VARCHAR(36) NOT NULL,
  school_id INT NOT NULL,
  enquiry_type ENUM('admission','career') NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) DEFAULT NULL,
  phone VARCHAR(20) NOT NULL,
  message TEXT DEFAULT NULL,
  extra_data LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(extra_data)),
  status ENUM('new','contacted','closed') DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uuid (uuid),
  KEY school_id (school_id),
  CONSTRAINT tbl_enquiries_ibfk_1 FOREIGN KEY (school_id) REFERENCES tbl_schools (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP PROCEDURE IF EXISTS _add_column_if_missing;

-- ── Eyeball checks — run these after the batch above to confirm the result ──
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME;

SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_schools'
ORDER BY ORDINAL_POSITION;
