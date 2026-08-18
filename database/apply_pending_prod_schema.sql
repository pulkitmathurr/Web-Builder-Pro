-- Combined "catch-up" script for production (Aiven) DB.
-- Aiven's MySQL version does not support "ADD COLUMN IF NOT EXISTS", so run each
-- ALTER TABLE statement ONE AT A TIME (select just that line, Ctrl+Enter to run only
-- the selected statement). If a statement errors with "Duplicate column name", that
-- column already exists -- skip it and move to the next statement. Do not run the
-- whole script as one block if you hit that error, since MySQL Workbench stops the
-- batch at the first error.

-- 1. Intro Message Enabled toggle
ALTER TABLE tbl_schools ADD COLUMN intro_message_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER intro_message;

-- 2. Footer Background
ALTER TABLE tbl_schools ADD COLUMN footer_bg_url VARCHAR(500) NULL AFTER welcome_banner_link;

-- 3. Background Music
ALTER TABLE tbl_schools ADD COLUMN bg_music_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER footer_bg_url;
ALTER TABLE tbl_schools ADD COLUMN bg_music_track VARCHAR(50) NULL AFTER bg_music_enabled;

-- 4. Affiliation Badges
ALTER TABLE tbl_schools ADD COLUMN affiliation_badges JSON NULL AFTER bg_music_track;

-- 5. Custom Domain
ALTER TABLE tbl_schools ADD COLUMN custom_domain VARCHAR(255) NULL AFTER affiliation_badges;

-- 6. Prospectus URL
ALTER TABLE tbl_schools ADD COLUMN prospectus_url VARCHAR(500) NULL AFTER custom_domain;

-- 7. Enquiries table (Admission / Career)
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
