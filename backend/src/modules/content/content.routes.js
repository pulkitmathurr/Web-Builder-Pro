const express = require('express');
const router = express.Router();
const {
    getModuleContent,
    saveModuleContent,
    togglePublish,
    getPublicModuleContent,
    getPublishedModules,
    uploadContentImageHandler,
    uploadPdfHandler,
    uploadVideoHandler,
} = require('./content.controller');
const { protect, isAdmin } = require('../../middlewares/auth.middleware');
const { uploadContentImage, uploadPdf, uploadVideo } = require('../../config/cloudinary');
// ── Public Routes ────────────────────────────────────
router.get('/public/:schoolId/modules/published', getPublishedModules);
router.get('/public/:schoolId/:moduleKey', getPublicModuleContent);

// ── Protected Routes ─────────────────────────────────
router.use(protect);
router.use(isAdmin);

router.post('/upload-image', uploadContentImage.single('image'), uploadContentImageHandler);
router.post('/upload-pdf', uploadPdf.single('pdf'), uploadPdfHandler);
router.post('/upload-video', uploadVideo.single('video'), uploadVideoHandler);
router.get('/:moduleKey', getModuleContent);
router.post('/:moduleKey', saveModuleContent);
router.patch('/:moduleKey/publish', togglePublish);

module.exports = router;