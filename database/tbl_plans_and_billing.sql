-- ═══════════════════════════════════════════════════════════════════════
-- Plans & Billing feature — SAFE, IDEMPOTENT script. Run as one batch.
-- Adds:
--   tbl_plans          — fixed 3 (tenure) x 3 (storage) pricing grid
--   tbl_payments        — Razorpay order/payment records
--   tbl_media_usage      — append-only per-upload storage ledger
--   tbl_schools ALTERs   — plan_id, plan_start_date, plan_end_date, storage_used_bytes
-- Existing tbl_schools.status ENUM('active','suspended','pending') is reused as the
-- approval gate — no new column needed there.
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

-- ── tbl_plans ─────────────────────────────────────────────────────────
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

-- ── tbl_payments ──────────────────────────────────────────────────────
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

-- ── tbl_media_usage ───────────────────────────────────────────────────
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

-- ── tbl_schools ALTERs (guarded) ──────────────────────────────────────
CALL _add_column_if_missing('tbl_schools', 'plan_id', '`plan_id` INT NULL AFTER `status`');
CALL _add_column_if_missing('tbl_schools', 'plan_start_date', '`plan_start_date` DATE NULL AFTER `plan_id`');
CALL _add_column_if_missing('tbl_schools', 'plan_end_date', '`plan_end_date` DATE NULL AFTER `plan_start_date`');
CALL _add_column_if_missing('tbl_schools', 'storage_used_bytes', '`storage_used_bytes` BIGINT NOT NULL DEFAULT 0 AFTER `plan_end_date`');

-- Self-signups (signup/signup.service.js) have no creating Super Admin, unlike every
-- prior school-creation path — MODIFY is naturally idempotent so no guard needed.
ALTER TABLE tbl_schools MODIFY COLUMN created_by INT NULL;

DROP PROCEDURE IF EXISTS _add_column_if_missing;

-- ── Eyeball checks ────────────────────────────────────────────────────
SELECT * FROM tbl_plans ORDER BY tenure_years, storage_mb;

SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_schools'
ORDER BY ORDINAL_POSITION;
