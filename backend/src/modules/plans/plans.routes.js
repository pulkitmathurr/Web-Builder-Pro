const express = require('express');
const router = express.Router();
const { getActivePlans, getAllPlans, createPlan, updatePlan, deletePlan } = require('./plans.controller');
const { protect, isSuperAdmin } = require('../../middlewares/auth.middleware');

// ── Public Routes ─────────────────────────────────────
router.get('/', getActivePlans);

// ── Super Admin Routes ────────────────────────────────
router.use(protect);
router.use(isSuperAdmin);

router.get('/all', getAllPlans);
router.post('/', createPlan);
router.patch('/:id', updatePlan);
router.delete('/:id', deletePlan);

module.exports = router;
