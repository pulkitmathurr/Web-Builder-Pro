const express = require('express');
const router = express.Router();
const {
    createSchool,
    getAllSchools,
    getSchoolByUuid,
    updateSchoolStatus,
    deleteSchool,
    createAdmin,
    updateAdminStatus,
    createSchoolWithAdmin,
    getDashboardStats,
    getPendingSchools,
    approveSchool,
    rejectSchool,
    assignPlan,
} = require('./superAdmin.controller');
const { protect, isSuperAdmin } = require('../../middlewares/auth.middleware');
const { upload } = require('../../config/cloudinary');

router.use(protect);
router.use(isSuperAdmin);

// ── Dashboard ────────────────────────────────────────
router.get('/dashboard-stats', getDashboardStats);

// ── School Routes ────────────────────────────────────
router.post('/schools', createSchool);
router.get('/schools', getAllSchools);
router.get('/schools/:uuid', getSchoolByUuid);
router.patch('/schools/:uuid/status', updateSchoolStatus);
router.delete('/schools/:uuid', deleteSchool);

// ── Approval Queue (self-signups) ────────────────────
router.get('/pending-schools', getPendingSchools);
router.patch('/schools/:uuid/approve', approveSchool);
router.patch('/schools/:uuid/reject', rejectSchool);
router.patch('/schools/:uuid/assign-plan', assignPlan);

// ── Create School + Admin Together ───────────────────
router.post('/schools/create-with-admin', upload.single('schoolImage'), createSchoolWithAdmin);

// ── Admin Routes ─────────────────────────────────────
router.post('/admins', createAdmin);
router.patch('/admins/:uuid/status', updateAdminStatus);

module.exports = router;