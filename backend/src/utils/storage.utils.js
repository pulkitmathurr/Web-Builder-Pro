const { pool } = require("../config/db");
const AppError = require("./error.utils");

// ── Record Media Usage ───────────────────────────────
// Appends one row to the storage ledger and bumps the school's denormalized
// running total in the same call, so the dashboard usage bar is a cheap
// single-row read instead of a SUM() over the ledger every time.
const recordMediaUsage = async ({ schoolId, moduleKey, resourceType, sizeBytes, url, publicId }) => {
    await pool.query(
        `INSERT INTO tbl_media_usage (school_id, module_key, resource_type, file_url, file_size_bytes, cloudinary_public_id)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [schoolId, moduleKey || null, resourceType, url, sizeBytes, publicId || null]
    );
    await pool.query(
        "UPDATE tbl_schools SET storage_used_bytes = storage_used_bytes + ? WHERE id = ?",
        [sizeBytes, schoolId]
    );
};

// ── Check Storage Limit ──────────────────────────────
// A school with no plan yet is treated as unlimited here — in practice this
// can't happen for real content uploads since a school without an active plan
// never gets past the /admin/billing gate on the frontend.
const checkStorageLimit = async (schoolId, incomingBytes) => {
    const [rows] = await pool.query(
        `SELECT s.storage_used_bytes, p.storage_mb
        FROM tbl_schools s
        LEFT JOIN tbl_plans p ON s.plan_id = p.id
        WHERE s.id = ?`,
        [schoolId]
    );
    if (rows.length === 0) throw new AppError("School not found", 404);
    const { storage_used_bytes, storage_mb } = rows[0];

    if (storage_mb == null) return;

    const limitBytes = storage_mb * 1024 * 1024;
    if (Number(storage_used_bytes) + Number(incomingBytes) > limitBytes) {
        throw new AppError("Storage limit reached for your plan — upgrade your plan to upload more", 413);
    }
};

// ── Express Middleware — pre-check before the multer/Cloudinary upload ──
// Uses Content-Length as a close-enough estimate of the incoming file size, so an
// over-limit request gets rejected before it spends any Cloudinary upload bandwidth.
const { sendError } = require("./response.utils");

const checkStorageLimitMiddleware = async (req, res, next) => {
    try {
        const incomingBytes = Number(req.headers["content-length"]) || 0;
        await checkStorageLimit(req.user.schoolId, incomingBytes);
        next();
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

module.exports = { recordMediaUsage, checkStorageLimit, checkStorageLimitMiddleware };
