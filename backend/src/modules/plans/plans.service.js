const { pool } = require("../../config/db");
const AppError = require("../../utils/error.utils");

// ── Get Active Plans (public — pricing grid) ─────────
const getActivePlansService = async () => {
    const [plans] = await pool.query(
        "SELECT id, uuid, tenure_years, storage_mb, price FROM tbl_plans WHERE is_active = 1 ORDER BY tenure_years, storage_mb"
    );
    return plans;
};

// ── Get All Plans (super admin — manage grid) ────────
const getAllPlansService = async () => {
    const [plans] = await pool.query(
        "SELECT id, uuid, tenure_years, storage_mb, price, is_active FROM tbl_plans ORDER BY tenure_years, storage_mb"
    );
    return plans;
};

// ── Update Plan (price / is_active) ──────────────────
const updatePlanService = async (id, data) => {
    const [plan] = await pool.query("SELECT id FROM tbl_plans WHERE id = ?", [id]);
    if (plan.length === 0) throw new AppError("Plan not found", 404);

    await pool.query(
        `UPDATE tbl_plans SET price = COALESCE(?, price), is_active = COALESCE(?, is_active) WHERE id = ?`,
        [data.price ?? null, data.isActive ?? null, id]
    );

    const [updated] = await pool.query("SELECT id, uuid, tenure_years, storage_mb, price, is_active FROM tbl_plans WHERE id = ?", [id]);
    return updated[0];
};

module.exports = { getActivePlansService, getAllPlansService, updatePlanService };
