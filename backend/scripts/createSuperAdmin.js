// One-off CLI script to create a Super Admin account directly in the DB.
// There is no signup/seed flow for Super Admins (only schools self-signup) —
// this is the only way to get the first production Super Admin login working.
//
// Usage (run from backend/, with a .env pointed at the target DB):
//   node scripts/createSuperAdmin.js "Name" "email@example.com" "StrongPassword123"
//
// Safe to re-run — exits without creating a duplicate if the email already exists.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../src/config/db');

const [name, email, password] = process.argv.slice(2);

const run = async () => {
    if (!name || !email || !password) {
        console.error('Usage: node scripts/createSuperAdmin.js "Name" "email@example.com" "StrongPassword123"');
        process.exit(1);
    }
    if (password.length < 6) {
        console.error('Password must be at least 6 characters.');
        process.exit(1);
    }

    const [existing] = await pool.query('SELECT id FROM tbl_super_admins WHERE email = ?', [email]);
    if (existing.length > 0) {
        console.log(`A super admin with email ${email} already exists (id ${existing[0].id}). Nothing to do.`);
        process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uuid = uuidv4();

    await pool.query(
        `INSERT INTO tbl_super_admins (uuid, name, email, password, is_active) VALUES (?, ?, ?, ?, 1)`,
        [uuid, name, email, hashedPassword]
    );

    console.log(`Super admin created: ${email}`);
    process.exit(0);
};

run().catch((err) => {
    console.error('Failed to create super admin:', err.message);
    process.exit(1);
});
