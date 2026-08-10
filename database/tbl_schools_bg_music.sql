-- Adds Background Music columns (admin Settings -> Background Music tab).
-- School picks one of a small curated set of royalty-free tracks (see
-- frontend/src/constants/musicTracks.js) rather than uploading their own file,
-- to avoid copyright issues. bg_music_track stores the preset track's `key`,
-- not a URL.
-- Apply by hand against any other environment (no migration runner in this project).

ALTER TABLE tbl_schools ADD COLUMN bg_music_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER footer_bg_url;
ALTER TABLE tbl_schools ADD COLUMN bg_music_track VARCHAR(50) NULL AFTER bg_music_enabled;
