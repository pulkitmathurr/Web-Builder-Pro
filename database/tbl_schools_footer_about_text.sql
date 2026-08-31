-- Adds a Footer About Text column (admin Settings -> Footer Background tab) — a
-- short editable blurb shown below the logo in the public Footer's Brand column,
-- replacing the address/phone that used to duplicate the Footer's own Contact Us
-- section. Apply by hand against any other environment (no migration runner in
-- this project).

ALTER TABLE tbl_schools ADD COLUMN footer_about_text VARCHAR(500) NULL AFTER footer_bg_url;
