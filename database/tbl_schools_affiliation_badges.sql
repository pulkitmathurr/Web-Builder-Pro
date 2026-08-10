-- Adds Affiliation Badges column (admin Settings -> Affiliation Badges tab).
-- Stores a small list (admin-capped at 3) of board/accreditation logos shown in the
-- navbar's top-right corner, next to the nav items — e.g. CBSE seal, Cambridge
-- Assessment logo. Each entry: { id, url, label } where label is optional alt/tooltip text.
-- Apply by hand against any other environment (no migration runner in this project).

ALTER TABLE tbl_schools ADD COLUMN affiliation_badges JSON NULL AFTER bg_music_track;
