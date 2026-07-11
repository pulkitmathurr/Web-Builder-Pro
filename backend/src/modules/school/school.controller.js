const {
    getSchoolProfileService,
    updateSchoolProfileService,
    updateSchoolSettingsService,
    selectModulesService,
    getSelectedModulesService,
    getPublicSchoolService,
} = require('./school.service');
const { sendSuccess, sendError } = require('../../utils/response.utils');

// ── Get School Profile ───────────────────────────────
const getSchoolProfile = async (req, res) => {
    try {
        const school = await getSchoolProfileService(req.user.schoolId);
        return sendSuccess(res, 'School profile received', school);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

// ── Update School Profile ────────────────────────────
const updateSchoolProfile = async (req, res) => {
    try {
        const school = await updateSchoolProfileService(req.user.schoolId, req.body);
        return sendSuccess(res, 'School profile updated', school);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

// ── Update School Settings ───────────────────────────
const updateSchoolSettings = async (req, res) => {
    try {
        const school = await updateSchoolSettingsService(req.user.schoolId, req.body);
        return sendSuccess(res, 'Settings updated', school);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

// ── Select Modules ───────────────────────────────────
const selectModules = async (req, res) => {
    try {
        const result = await selectModulesService(req.user.schoolId, req.body.modules);
        return sendSuccess(res, 'Modules selected', result);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

// ── Get Selected Modules ─────────────────────────────
const getSelectedModules = async (req, res) => {
    try {
        const result = await getSelectedModulesService(req.user.schoolId);
        return sendSuccess(res, 'Selected modules received', result);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

// ── Get Public School ────────────────────────────────
const getPublicSchool = async (req, res) => {
    try {
        const school = await getPublicSchoolService(req.params.slug);
        return sendSuccess(res, 'School data fetched', school);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

// ── Upload Hero Video ────────────────────────────────
const uploadHeroVideo = async (req, res) => {
    try {
        if (!req.file) return sendError(res, 'No video file uploaded', 400);
        const videoUrl = req.file.path;
        const title = req.body.title || '';
        await updateSchoolProfileService(req.user.schoolId, {
            hero_video_url: videoUrl,
            hero_video_title: title
        });
        return sendSuccess(res, 'Hero video uploaded successfully', { hero_video_url: videoUrl });
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

// ── Upload School Logo ───────────────────────────────
const uploadSchoolLogo = async (req, res) => {
    try {
        if (!req.file) return sendError(res, 'No file uploaded', 400);
        const logoUrl = req.file.path;
        await updateSchoolProfileService(req.user.schoolId, { logo_url: logoUrl });
        return sendSuccess(res, 'Logo uploaded successfully', { logo_url: logoUrl });
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const stats = await getDashboardStatsService();
        return sendSuccess(res, 'Dashboard stats fetched', stats);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

module.exports = {
    getSchoolProfile,
    updateSchoolProfile,
    updateSchoolSettings,
    selectModules,
    getSelectedModules,
    getPublicSchool,
    uploadHeroVideo,
    uploadSchoolLogo,
    getDashboardStats,
};