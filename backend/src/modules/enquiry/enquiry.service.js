const { pool } = require("../../config/db");
const { v4: uuidv4 } = require("uuid");
const AppError = require("../../utils/error.utils");

// ── Submit Enquiry (public) ──────────────────────────
const submitEnquiryService = async (schoolId, { type, name, email, phone, message, extra }) => {
    const uuid = uuidv4();

    await pool.query(
        `INSERT INTO tbl_enquiries (uuid, school_id, enquiry_type, name, email, phone, message, extra_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuid, schoolId, type, name, email || null, phone, message || null, extra ? JSON.stringify(extra) : null]
    );

    return { uuid };
};

// ── List Enquiries (admin, scoped to school + type) ──
const getEnquiriesService = async (schoolId, type) => {
    const [rows] = await pool.query(
        `SELECT id, uuid, name, email, phone, message, extra_data, status, created_at
         FROM tbl_enquiries WHERE school_id = ? AND enquiry_type = ? ORDER BY created_at DESC`,
        [schoolId, type]
    );

    return rows.map(row => ({
        ...row,
        extra_data: typeof row.extra_data === 'string' ? JSON.parse(row.extra_data) : row.extra_data,
    }));
};

// ── Update Status (admin) — scoped by school_id so an admin can't touch another school's row ──
const updateEnquiryStatusService = async (schoolId, uuid, status) => {
    const [result] = await pool.query(
        `UPDATE tbl_enquiries SET status = ? WHERE uuid = ? AND school_id = ?`,
        [status, uuid, schoolId]
    );

    if (result.affectedRows === 0) {
        throw new AppError("Enquiry not found", 404);
    }

    return { uuid, status };
};

// ── Delete Enquiry (admin) ───────────────────────────
const deleteEnquiryService = async (schoolId, uuid) => {
    const [result] = await pool.query(
        `DELETE FROM tbl_enquiries WHERE uuid = ? AND school_id = ?`,
        [uuid, schoolId]
    );

    if (result.affectedRows === 0) {
        throw new AppError("Enquiry not found", 404);
    }

    return { uuid };
};

module.exports = {
    submitEnquiryService,
    getEnquiriesService,
    updateEnquiryStatusService,
    deleteEnquiryService,
};
