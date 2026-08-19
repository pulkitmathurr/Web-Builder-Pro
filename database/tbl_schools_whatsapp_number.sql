-- Adds the WhatsApp Number column (admin Contact Us -> Location tab), used to power
-- the floating WhatsApp chat button on every public school page.
-- Already applied to the local dev database; apply by hand against production too
-- (no migration runner in this project).

ALTER TABLE tbl_schools ADD COLUMN whatsapp_number VARCHAR(20) NULL AFTER phone2;
