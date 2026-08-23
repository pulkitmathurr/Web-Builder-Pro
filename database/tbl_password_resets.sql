-- Backs the "Forgot Password" flow for both School Admin and Super Admin.
-- One row per requested reset; token is stored as a SHA-256 hash (never the
-- raw token, which only ever exists in the emailed link) so a DB read alone
-- can't be used to reset an account. A row is single-use (used_at) and
-- short-lived (expires_at, set to now + 30 minutes by the backend).
-- Apply by hand against any other environment (no migration runner in this project).

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
