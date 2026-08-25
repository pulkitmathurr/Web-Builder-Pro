const express = require('express');
const router = express.Router();
const { getActivePlans, getAllPlans, updatePlan } = require('./plans.controller');
const { protect, isSuperAdmin } = require('../../middlewares/auth.middleware');

// ── Public Routes ─────────────────────────────────────
router.get('/', getActivePlans);

// ── Super Admin Routes ────────────────────────────────
router.use(protect);
router.use(isSuperAdmin);

router.get('/all', getAllPlans);
router.patch('/:id', updatePlan);

module.exports = router;
