-- Adds the Prospectus URL column (admin Settings -> Prospectus tab).
-- The public site shows a "Download Prospectus" floating tab next to the
-- Admission/Career Enquiry tabs only when this is set (no upload = tab hidden).
-- Apply by hand against production too (no migration runner in this project).

ALTER TABLE tbl_schools ADD COLUMN prospectus_url VARCHAR(500) NULL AFTER custom_domain;
