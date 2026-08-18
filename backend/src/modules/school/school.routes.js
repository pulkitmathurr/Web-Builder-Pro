const express = require('express');
const router = express.Router();
const {
    getSchoolProfile,
    updateSchoolProfile,
    updateSchoolSettings,
    selectModules,
    getSelectedModules,
    getPublicSchool,
    getSchoolByDomain,
    uploadHeroVideo,
    uploadSchoolLogo,
    uploadWelcomeBanner,
    uploadFooterBackground,
    uploadProspectus
} = require('./school.controller');
const { protect, isAdmin } = require('../../middlewares/auth.middleware');
const { upload, uploadVideo, uploadContentImage, uploadPdf } = require('../../config/cloudinary');

// ── Public Routes — No Auth ──────────────────────────
router.get('/public/:slug', getPublicSchool);
router.get('/public-domain/:domain', getSchoolByDomain);

// ── Protected Routes ─────────────────────────────────
router.use(protect);
router.use(isAdmin);

// ── Profile Routes ───────────────────────────────────
router.get('/profile', getSchoolProfile);
router.put('/profile', updateSchoolProfile);


// ── Settings Routes ──────────────────────────────────
router.put('/settings', updateSchoolSettings);

// ── Module Routes ────────────────────────────────────
router.post('/modules', selectModules);
router.get('/modules', getSelectedModules);

// ── Logo Upload ──────────────────────────────────────
router.post('/logo', upload.single('schoolLogo'), uploadSchoolLogo);

// ── Video Upload ─────────────────────────────────────
router.post('/hero-video', uploadVideo.single('heroVideo'), uploadHeroVideo);

// ── Welcome Banner Upload ────────────────────────────
router.post('/welcome-banner', uploadContentImage.single('welcomeBanner'), uploadWelcomeBanner);

// ── Footer Background Upload ─────────────────────────
router.post('/footer-bg', uploadContentImage.single('footerBg'), uploadFooterBackground);

// ── Prospectus Upload ────────────────────────────────
router.post('/prospectus', uploadPdf.single('prospectus'), uploadProspectus);

module.exports = router;