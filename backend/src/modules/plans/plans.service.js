const { pool } = require("../../config/db");
const { v4: uuidv4 } = require("uuid");
const AppError = require("../../utils/error.utils");

// `features` is a JSON column — mysql2 returns it already parsed on read, and
// wants a JSON string on write. Normalise to a plain string[] in both directions.
const parseFeatures = (val) => {
    if (Array.isArray(val)) return val.map((f) => String(f).trim()).filter(Boolean);
    if (typeof val === "string" && val.trim()) {
        try {
            const p = JSON.parse(val);
            return Array.isArray(p) ? p.map((f) => String(f).trim()).filter(Boolean) : [];
        } catch {
            return [];
        }
    }
    return [];
};

const PUBLIC_COLS = "id, uuid, name, description, features, tenure_years, storage_mb, price";
const ADMIN_COLS = `${PUBLIC_COLS}, is_active, sort_order`;

// ── Get Active Plans (public — pricing list on the School Admin Billing page) ──
const getActivePlansService = async () => {
    const [plans] = await pool.query(
        `SELECT ${PUBLIC_COLS} FROM tbl_plans WHERE is_active = 1 ORDER BY sort_order, price, id`
    );
    return plans.map((p) => ({ ...p, features: parseFeatures(p.features) }));
};

// ── Get All Plans (super admin — manage list) ──
const getAllPlansService = async () => {
    const [plans] = await pool.query(
        `SELECT ${ADMIN_COLS} FROM tbl_plans ORDER BY sort_order, price, id`
    );
    return plans.map((p) => ({ ...p, features: parseFeatures(p.features) }));
};

// ── Create Plan ──
const createPlanService = async (data) => {
    const { name, tenureYears, storageMb, price, description, features, isActive, sortOrder } = data;

    if (!name || !String(name).trim()) throw new AppError("Plan name is required", 400);
    if (!Number.isFinite(Number(tenureYears)) || Number(tenureYears) < 1) {
        throw new AppError("Tenure (years) must be at least 1", 400);
    }
    if (!Number.isFinite(Number(storageMb)) || Number(storageMb) < 1) {
        throw new AppError("Storage (MB) must be a positive number", 400);
    }
    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
        throw new AppError("Price must be zero or more", 400);
    }

    const uuid = uuidv4();
    const [result] = await pool.query(
        `INSERT INTO tbl_plans
            (uuid, name, tenure_years, storage_mb, price, description, features, is_active, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            uuid,
            String(name).trim(),
            Math.round(Number(tenureYears)),
            Math.round(Number(storageMb)),
            Number(price),
            description ? String(description).trim() : null,
            JSON.stringify(parseFeatures(features)),
            isActive === 0 || isActive === false ? 0 : 1,
            Number.isFinite(Number(sortOrder)) ? Math.round(Number(sortOrder)) : 0,
        ]
    );

    const [rows] = await pool.query(`SELECT ${ADMIN_COLS} FROM tbl_plans WHERE id = ?`, [result.insertId]);
    return { ...rows[0], features: parseFeatures(rows[0].features) };
};

// ── Update Plan (any field — only the keys present in the body are touched) ──
const updatePlanService = async (id, data) => {
    const [plan] = await pool.query("SELECT id FROM tbl_plans WHERE id = ?", [id]);
    if (plan.length === 0) throw new AppError("Plan not found", 404);

    const sets = [];
    const vals = [];

    if (data.name !== undefined) {
        if (!String(data.name).trim()) throw new AppError("Plan name can't be empty", 400);
        sets.push("name = ?");
        vals.push(String(data.name).trim());
    }
    if (data.tenureYears !== undefined) {
        if (!Number.isFinite(Number(data.tenureYears)) || Number(data.tenureYears) < 1) {
            throw new AppError("Tenure (years) must be at least 1", 400);
        }
        sets.push("tenure_years = ?");
        vals.push(Math.round(Number(data.tenureYears)));
    }
    if (data.storageMb !== undefined) {
        if (!Number.isFinite(Number(data.storageMb)) || Number(data.storageMb) < 1) {
            throw new AppError("Storage (MB) must be a positive number", 400);
        }
        sets.push("storage_mb = ?");
        vals.push(Math.round(Number(data.storageMb)));
    }
    if (data.price !== undefined) {
        if (!Number.isFinite(Number(data.price)) || Number(data.price) < 0) {
            throw new AppError("Price must be zero or more", 400);
        }
        sets.push("price = ?");
        vals.push(Number(data.price));
    }
    if (data.description !== undefined) {
        sets.push("description = ?");
        vals.push(data.description ? String(data.description).trim() : null);
    }
    if (data.features !== undefined) {
        sets.push("features = ?");
        vals.push(JSON.stringify(parseFeatures(data.features)));
    }
    if (data.isActive !== undefined) {
        sets.push("is_active = ?");
        vals.push(data.isActive ? 1 : 0);
    }
    if (data.sortOrder !== undefined) {
        sets.push("sort_order = ?");
        vals.push(Math.round(Number(data.sortOrder)));
    }

    if (sets.length === 0) throw new AppError("Nothing to update", 400);

    vals.push(id);
    await pool.query(`UPDATE tbl_plans SET ${sets.join(", ")} WHERE id = ?`, vals);

    const [updated] = await pool.query(`SELECT ${ADMIN_COLS} FROM tbl_plans WHERE id = ?`, [id]);
    return { ...updated[0], features: parseFeatures(updated[0].features) };
};

// ── Delete Plan (blocked while any school / payment still references it) ──
const deletePlanService = async (id) => {
    const [plan] = await pool.query("SELECT id FROM tbl_plans WHERE id = ?", [id]);
    if (plan.length === 0) throw new AppError("Plan not found", 404);

    const [[{ schoolCount }]] = await pool.query(
        "SELECT COUNT(*) AS schoolCount FROM tbl_schools WHERE plan_id = ?",
        [id]
    );
    if (schoolCount > 0) {
        throw new AppError(
            `Can't delete — ${schoolCount} school${schoolCount > 1 ? "s are" : " is"} on this plan. Deactivate it instead.`,
            400
        );
    }

    const [[{ payCount }]] = await pool.query(
        "SELECT COUNT(*) AS payCount FROM tbl_payments WHERE plan_id = ?",
        [id]
    );
    if (payCount > 0) {
        throw new AppError("Can't delete — this plan has payment records. Deactivate it instead.", 400);
    }

    await pool.query("DELETE FROM tbl_plans WHERE id = ?", [id]);
    return { message: "Plan deleted" };
};

module.exports = {
    getActivePlansService,
    getAllPlansService,
    createPlanService,
    updatePlanService,
    deletePlanService,
};
