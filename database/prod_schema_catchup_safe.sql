-- ═══════════════════════════════════════════════════════════════════════
-- SAFE, IDEMPOTENT production schema catch-up script.
-- Run this ENTIRE file as one batch (MySQL Workbench: open file, Ctrl+Shift+Enter
-- "Execute all"). Every ALTER checks INFORMATION_SCHEMA before running, and every
-- CREATE TABLE uses IF NOT EXISTS, so already-applied changes are skipped instead
-- of erroring out and halting the batch. Safe to re-run any number of times.
--
-- This is the ONE script to run against a fresh/behind production DB — it now
-- covers every change under database/*.sql (previously this file only covered
-- tbl_schools cosmetic columns + tbl_enquiries; it was missing the Forgot
-- Password and Plans & Billing tables added afterwards — those are folded in
-- below so nothing gets missed a second time):
--   tbl_schools: intro_message_enabled, footer_bg_url, bg_music_enabled,
--                bg_music_track, affiliation_badges, custom_domain,
--                prospectus_url, whatsapp_number, plan_id, plan_start_date,
--                plan_end_date, storage_used_bytes, created_by (nullable)
--   tbl_enquiries: full table (Admission/Career enquiry modules)
--   tbl_password_resets: full table (Forgot/Reset Password flow)
--   tbl_plans, tbl_payments, tbl_media_usage: full tables (Plans & Billing)
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

-- ── tbl_schools: cosmetic / feature columns ──────────────────────────────
CALL _add_column_if_missing('tbl_schools', 'intro_message_enabled', '`intro_message_enabled` TINYINT(1) NOT NULL DEFAULT 1 AFTER `intro_message`');
CALL _add_column_if_missing('tbl_schools', 'footer_bg_url', '`footer_bg_url` VARCHAR(500) NULL AFTER `welcome_banner_link`');
CALL _add_column_if_missing('tbl_schools', 'bg_music_enabled', '`bg_music_enabled` TINYINT(1) NOT NULL DEFAULT 0 AFTER `footer_bg_url`');
CALL _add_column_if_missing('tbl_schools', 'bg_music_track', '`bg_music_track` VARCHAR(50) NULL AFTER `bg_music_enabled`');
CALL _add_column_if_missing('tbl_schools', 'affiliation_badges', '`affiliation_badges` JSON NULL AFTER `bg_music_track`');
CALL _add_column_if_missing('tbl_schools', 'custom_domain', '`custom_domain` VARCHAR(255) NULL AFTER `affiliation_badges`');
CALL _add_column_if_missing('tbl_schools', 'prospectus_url', '`prospectus_url` VARCHAR(500) NULL AFTER `custom_domain`');
CALL _add_column_if_missing('tbl_schools', 'whatsapp_number', '`whatsapp_number` VARCHAR(20) NULL AFTER `phone2`');

-- ── tbl_enquiries (Admission / Career) ───────────────────────────────────
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

-- ── tbl_password_resets (Forgot/Reset Password) ──────────────────────────
CREATE TABLE IF NOT EXISTS tbl_password_resets (
  id INT NOT NULL AUTO_INCREMENT,
  role ENUM('admin','super_admin') NOT NULL,
  admin_id INT NULL,
  super_admin_id INT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY token_hash (token_hash),
  KEY admin_id (admin_id),
  KEY super_admin_id (super_admin_id),
  CONSTRAINT tbl_password_resets_admin_fk FOREIGN KEY (admin_id) REFERENCES tbl_admins (id) ON DELETE CASCADE,
  CONSTRAINT tbl_password_resets_super_admin_fk FOREIGN KEY (super_admin_id) REFERENCES tbl_super_admins (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Plans & Billing ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tbl_plans (
  id INT NOT NULL AUTO_INCREMENT,
  uuid VARCHAR(36) NOT NULL,
  tenure_years TINYINT NOT NULL,
  storage_mb INT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uuid (uuid),
  UNIQUE KEY tenure_storage (tenure_years, storage_mb)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO tbl_plans (uuid, tenure_years, storage_mb, price) VALUES
  (UUID(), 1, 200, 0.00),
  (UUID(), 1, 400, 0.00),
  (UUID(), 1, 1024, 0.00),
  (UUID(), 2, 200, 0.00),
  (UUID(), 2, 400, 0.00),
  (UUID(), 2, 1024, 0.00),
  (UUID(), 3, 200, 0.00),
  (UUID(), 3, 400, 0.00),
  (UUID(), 3, 1024, 0.00);

CREATE TABLE IF NOT EXISTS tbl_payments (
  id INT NOT NULL AUTO_INCREMENT,
  uuid VARCHAR(36) NOT NULL,
  school_id INT NOT NULL,
  plan_id INT NOT NULL,
  razorpay_order_id VARCHAR(64) NOT NULL,
  razorpay_payment_id VARCHAR(64) DEFAULT NULL,
  razorpay_signature VARCHAR(255) DEFAULT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status ENUM('created','paid','failed') NOT NULL DEFAULT 'created',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uuid (uuid),
  KEY school_id (school_id),
  KEY plan_id (plan_id),
  CONSTRAINT tbl_payments_school_fk FOREIGN KEY (school_id) REFERENCES tbl_schools (id),
  CONSTRAINT tbl_payments_plan_fk FOREIGN KEY (plan_id) REFERENCES tbl_plans (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tbl_media_usage (
  id INT NOT NULL AUTO_INCREMENT,
  school_id INT NOT NULL,
  module_key VARCHAR(50) DEFAULT NULL,
  resource_type ENUM('image','pdf','video') NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  cloudinary_public_id VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY school_id (school_id),
  KEY module_key (module_key),
  CONSTRAINT tbl_media_usage_school_fk FOREIGN KEY (school_id) REFERENCES tbl_schools (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CALL _add_column_if_missing('tbl_schools', 'plan_id', '`plan_id` INT NULL AFTER `status`');
CALL _add_column_if_missing('tbl_schools', 'plan_start_date', '`plan_start_date` DATE NULL AFTER `plan_id`');
CALL _add_column_if_missing('tbl_schools', 'plan_end_date', '`plan_end_date` DATE NULL AFTER `plan_start_date`');
CALL _add_column_if_missing('tbl_schools', 'storage_used_bytes', '`storage_used_bytes` BIGINT NOT NULL DEFAULT 0 AFTER `plan_end_date`');

-- Self-signups (signup/signup.service.js) have no creating Super Admin, unlike every
-- prior school-creation path — MODIFY is naturally idempotent so no guard needed.
ALTER TABLE tbl_schools MODIFY COLUMN created_by INT NULL;

DROP PROCEDURE IF EXISTS _add_column_if_missing;

-- ── Eyeball checks — run these after the batch above to confirm the result ──
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME;

SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_schools'
ORDER BY ORDINAL_POSITION;

SELECT * FROM tbl_plans ORDER BY tenure_years, storage_mb;
