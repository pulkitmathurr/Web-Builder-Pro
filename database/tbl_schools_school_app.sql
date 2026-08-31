-- Adds the "School App" floating button (admin Settings -> School App tab) — an
-- optional 4th floating right-edge tab, alongside Admission/Career Enquiry and
-- Prospectus, that links out to wherever the school's own app is hosted (Play
-- Store, App Store, or any other download page). `school_app_label` lets the
-- admin name the button (e.g. "Download Our App"); `school_app_url` is the link.
-- Apply by hand against any other environment (no migration runner in this project).

ALTER TABLE tbl_schools ADD COLUMN school_app_label VARCHAR(100) NULL AFTER prospectus_url;
ALTER TABLE tbl_schools ADD COLUMN school_app_url VARCHAR(500) NULL AFTER school_app_label;
