const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, handleWebhook } = require('./billing.controller');
const { protect, isAdmin } = require('../../middlewares/auth.middleware');

// Public — Razorpay's server posts here with no user session, so it must sit
// ABOVE the protect/isAdmin guards below. Its "auth" is the HMAC signature
// check inside the handler (RAZORPAY_WEBHOOK_SECRET).
router.post('/webhook', handleWebhook);

router.use(protect);
router.use(isAdmin);

router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);

module.exports = router;
