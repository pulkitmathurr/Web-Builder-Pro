-- Adds a toggle for the Website Intro Animation (admin Settings -> Profile ->
-- "Website Intro Animation" card), so a school can keep the intro message text
-- saved but turn the animation off without deleting it. Defaults to 1 (enabled)
-- so existing schools that already have an intro_message keep behaving exactly
-- as before this column existed.
-- Apply by hand against any other environment (no migration runner in this project).

ALTER TABLE tbl_schools ADD COLUMN intro_message_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER intro_message;
