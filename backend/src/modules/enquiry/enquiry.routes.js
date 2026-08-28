const express = require('express');
const router = express.Router();
const {
    submitEnquiry,
    getEnquiries,
    updateEnquiryStatus,
    deleteEnquiry,
} = require('./enquiry.controller');
const { protect, isAdmin } = require('../../middlewares/auth.middleware');
const { enquiryLimiter } = require('../../middlewares/rateLimit.middleware');

// ── Public Routes ─────────────────────────────────────
router.post('/public/:schoolId', enquiryLimiter, submitEnquiry);

// ── Protected Routes ──────────────────────────────────
router.use(protect);
router.use(isAdmin);

router.get('/:type', getEnquiries);
router.patch('/:uuid/status', updateEnquiryStatus);
router.delete('/:uuid', deleteEnquiry);

module.exports = router;
