const { createOrderService, verifyPaymentService, handleWebhookService } = require('./billing.service');
const { sendSuccess, sendError } = require('../../utils/response.utils');

const createOrder = async (req, res) => {
    try {
        const order = await createOrderService(req.user.schoolId, req.body.planId);
        return sendSuccess(res, 'Order created', order, 201);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const verifyPayment = async (req, res) => {
    try {
        const result = await verifyPaymentService(req.user.schoolId, req.body);
        return sendSuccess(res, result.message);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

// Razorpay's server calls this — no user session. `req.rawBody` is stashed by
// the express.json() verify hook in app.js so the HMAC can be checked against
// the exact bytes received.
const handleWebhook = async (req, res) => {
    try {
        const result = await handleWebhookService(req.rawBody, req.headers['x-razorpay-signature']);
        return sendSuccess(res, 'Webhook processed', result);
    } catch (error) {
        console.error('[billing] webhook failed:', error.message);
        // 400 = bad signature/payload (a misconfig we want to stay visible in
        // the Razorpay dashboard). Anything else = 500 so Razorpay retries and
        // the plan still activates once our side recovers.
        return sendError(res, error.message, error.statusCode === 400 ? 400 : 500);
    }
};

module.exports = { createOrder, verifyPayment, handleWebhook };
