const { createOrderService, verifyPaymentService } = require('./billing.service');
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

module.exports = { createOrder, verifyPayment };
