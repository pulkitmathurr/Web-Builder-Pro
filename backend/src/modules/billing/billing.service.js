const crypto = require("crypto");
const Razorpay = require("razorpay");
const { v4: uuidv4 } = require("uuid");
const { pool } = require("../../config/db");
const AppError = require("../../utils/error.utils");

// Constructed lazily (not at module load) so the server still boots when
// RAZORPAY_KEY_ID/SECRET aren't configured yet in local dev — the SDK throws
// synchronously in its constructor if key_id is missing.
const getRazorpayClient = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new AppError("Payments aren't configured yet — contact Web Builder Pro", 503);
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

// ── Create Order ──────────────────────────────────────
const createOrderService = async (schoolId, planId) => {
    const razorpay = getRazorpayClient();
    const [plans] = await pool.query("SELECT id, price FROM tbl_plans WHERE id = ? AND is_active = 1", [planId]);
    if (plans.length === 0) throw new AppError("Plan not found", 404);
    const plan = plans[0];

    if (Number(plan.price) <= 0) {
        throw new AppError("This plan isn't priced yet — contact Web Builder Pro", 400);
    }

    const amountPaise = Math.round(Number(plan.price) * 100);
    const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: `school-${schoolId}-plan-${planId}-${Date.now()}`,
    });

    const uuid = uuidv4();
    await pool.query(
        `INSERT INTO tbl_payments (uuid, school_id, plan_id, razorpay_order_id, amount, currency, status)
        VALUES (?, ?, ?, ?, ?, 'INR', 'created')`,
        [uuid, schoolId, plan.id, order.id, plan.price]
    );

    return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
    };
};

// ── Verify Payment ────────────────────────────────────
const verifyPaymentService = async (schoolId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new AppError("Missing payment verification details", 400);
    }

    const [payments] = await pool.query(
        "SELECT * FROM tbl_payments WHERE razorpay_order_id = ? AND school_id = ?",
        [razorpay_order_id, schoolId]
    );
    if (payments.length === 0) throw new AppError("Payment record not found", 404);
    const payment = payments[0];

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        await pool.query("UPDATE tbl_payments SET status = 'failed' WHERE id = ?", [payment.id]);
        throw new AppError("Payment verification failed", 400);
    }

    await pool.query(
        `UPDATE tbl_payments SET status = 'paid', razorpay_payment_id = ?, razorpay_signature = ? WHERE id = ?`,
        [razorpay_payment_id, razorpay_signature, payment.id]
    );

    const [plans] = await pool.query("SELECT tenure_years FROM tbl_plans WHERE id = ?", [payment.plan_id]);
    const tenureYears = plans[0].tenure_years;

    await pool.query(
        `UPDATE tbl_schools
        SET plan_id = ?, plan_start_date = CURDATE(), plan_end_date = DATE_ADD(CURDATE(), INTERVAL ? YEAR)
        WHERE id = ?`,
        [payment.plan_id, tenureYears, schoolId]
    );

    return { message: "Payment verified — plan activated" };
};

module.exports = { createOrderService, verifyPaymentService };
