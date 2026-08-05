const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ── SSL (Aiven requires SSL) ─────────────────────────────────────────
// DB_SSL_CA_PATH points at the downloaded ca.pem (defaults to backend/ca.pem,
// same file Render will see since it's committed — see .gitignore note).
// Local XAMPP MySQL doesn't need/support SSL, so this only kicks in when the
// cert file is actually present — no extra env flag needed to switch modes.
const caPath = path.resolve(__dirname, '../../', process.env.DB_SSL_CA_PATH || 'ca.pem');
const sslConfig = fs.existsSync(caPath)
    ? { ca: fs.readFileSync(caPath, 'utf8') }
    : undefined;

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ...(sslConfig && { ssl: sslConfig }),
});

const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = { pool, testConnection };