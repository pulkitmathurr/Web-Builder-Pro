const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('./billing.controller');
const { protect, isAdmin } = require('../../middlewares/auth.middleware');

router.use(protect);
router.use(isAdmin);

router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);

module.exports = router;
