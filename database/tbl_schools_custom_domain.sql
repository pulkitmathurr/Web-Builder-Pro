-- Adds the Custom Domain column (admin Settings -> Custom Domain tab).
-- School admins can point their own domain (e.g. www.theirschool.com) at their
-- public site via a DNS CNAME record. This column only stores the admin's chosen
-- domain string -- there is no host-based tenant resolution wired up yet, so
-- setting this does not make the site live on that domain by itself.
-- Apply by hand against production too (no migration runner in this project).

ALTER TABLE tbl_schools ADD COLUMN custom_domain VARCHAR(255) NULL AFTER affiliation_badges;
