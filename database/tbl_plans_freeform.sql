-- ═══════════════════════════════════════════════════════════════════════
-- Plans free-form upgrade — SAFE, IDEMPOTENT script. Run as one batch.
--
-- Turns tbl_plans from the fixed 3 (tenure) x 3 (storage) grid into a
-- free-form list the Super Admin fully designs from the Plans page:
--   name, price, storage_mb, tenure_years, description, features[]
--
-- Adds columns:  name, description, features (JSON), sort_order
-- Drops the UNIQUE KEY (tenure_years, storage_mb) so arbitrary combos
-- (and duplicates) are allowed.
--
-- Apply this by hand to every environment, same as the rest of the schema.
-- Run AFTER database/tbl_plans_and_billing.sql (which creates tbl_plans).
-- ═══════════════════════════════════════════════════════════════════════

DELIMITER $$

DROP PROCEDURE IF EXISTS _plans_add_col $$
CREATE PROCEDURE _plans_add_col(IN p_column VARCHAR(64), IN p_definition VARCHAR(500))
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tbl_plans'
      AND COLUMN_NAME = p_column
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `tbl_plans` ADD COLUMN ', p_definition);
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    SELECT CONCAT('ADDED: tbl_plans.', p_column) AS result;
  ELSE
    SELECT CONCAT('SKIPPED (already exists): tbl_plans.', p_column) AS result;
  END IF;
END $$

DROP PROCEDURE IF EXISTS _plans_drop_index $$
CREATE PROCEDURE _plans_drop_index(IN p_index VARCHAR(64))
BEGIN
  IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tbl_plans'
      AND INDEX_NAME = p_index
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `tbl_plans` DROP INDEX `', p_index, '`');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    SELECT CONCAT('DROPPED INDEX: ', p_index) AS result;
  ELSE
    SELECT CONCAT('SKIPPED (no such index): ', p_index) AS result;
  END IF;
END $$

DELIMITER ;

-- ── New columns ──────────────────────────────────────────────────────
CALL _plans_add_col('name',        "`name` VARCHAR(100) NOT NULL DEFAULT '' AFTER `uuid`");
CALL _plans_add_col('description', "`description` VARCHAR(500) NULL AFTER `price`");
CALL _plans_add_col('features',    "`features` JSON NULL AFTER `description`");
CALL _plans_add_col('sort_order',  "`sort_order` INT NOT NULL DEFAULT 0 AFTER `is_active`");

-- ── Drop the fixed-grid uniqueness so plans can be free-form ─────────
CALL _plans_drop_index('tenure_storage');

-- ── Backfill a readable name for the original seeded rows ───────────
UPDATE tbl_plans
SET name = CONCAT(
    tenure_years, '-Year · ',
    CASE WHEN storage_mb >= 1024 AND storage_mb MOD 1024 = 0
         THEN CONCAT(storage_mb DIV 1024, ' GB')
         ELSE CONCAT(storage_mb, ' MB') END
)
WHERE name = '' OR name IS NULL;

DROP PROCEDURE IF EXISTS _plans_add_col;
DROP PROCEDURE IF EXISTS _plans_drop_index;

-- ── Eyeball check ───────────────────────────────────────────────────
SELECT id, name, tenure_years, storage_mb, price, is_active, sort_order
FROM tbl_plans
ORDER BY sort_order, price, id;
