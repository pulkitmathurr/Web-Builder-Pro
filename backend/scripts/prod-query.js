// One-off read/debug tool against the PRODUCTION Aiven DB.
// Usage: node scripts/prod-query.js "SELECT * FROM tbl_plans LIMIT 5"
// Credentials come from backend/.env.production (gitignored) — never pass
// them inline on the command line.
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.production') });

const sql = process.argv[2];
if (!sql) {
    console.error('Usage: node scripts/prod-query.js "<SQL>"');
    process.exit(1);
}
if (!process.env.DB_HOST) {
    console.error('backend/.env.production is not filled in yet (DB_HOST is empty).');
    process.exit(1);
}

const caPath = path.resolve(__dirname, '../', process.env.DB_SSL_CA_PATH || 'ca.pem');
const ssl = fs.existsSync(caPath) ? { ca: fs.readFileSync(caPath, 'utf8') } : undefined;

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl,
    });
    try {
        const [rows] = await conn.query(sql);
        console.log(JSON.stringify(rows, null, 2));
    } finally {
        await conn.end();
    }
})().catch((err) => {
    console.error('Query failed:', err.message);
    process.exit(1);
});
