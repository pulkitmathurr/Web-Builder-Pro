-- Adds the Footer Background column (admin Settings -> Footer Background tab).
-- Already applied to the local dev database; apply by hand against production too
-- (no migration runner in this project).

ALTER TABLE tbl_schools ADD COLUMN footer_bg_url VARCHAR(500) NULL AFTER welcome_banner_link;
