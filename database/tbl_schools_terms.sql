-- Adds the "Terms & Content Responsibility" consent gate — a new AdminLayout
-- gate (checked before the plan/billing gate) that force-redirects an admin to
-- /admin/accept-terms until they tick the consent checkbox once. Recorded here
-- rather than on tbl_admins because every other onboarding gate (is_first_login,
-- plan_id) is already per-school, not per-admin-account.
-- Apply by hand against any other environment (no migration runner in this project).

ALTER TABLE tbl_schools ADD COLUMN terms_accepted_at DATETIME NULL AFTER is_first_login;
ALTER TABLE tbl_schools ADD COLUMN terms_version INT NULL AFTER terms_accepted_at;
