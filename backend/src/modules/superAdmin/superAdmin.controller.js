const {
    createSchoolService,
    getAllSchoolsService,
    getSchoolByUuidService,
    updateSchoolStatusService,
    deleteSchoolService,
    createAdminService,
    updateAdminStatusService,
    createSchoolWithAdminService,
    getDashboardStatsService,
} = require('./superAdmin.service');
const { sendSuccess, sendError } = require('../../utils/response.utils');

const createSchool = async (req, res) => {
    try {
        const school = await createSchoolService(req.body, req.user.id);
        return sendSuccess(res, 'School successfully banayi gayi', school, 201);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const getAllSchools = async (req, res) => {
    try {
        const schools = await getAllSchoolsService();
        return sendSuccess(res, 'Saare schools mil gaye', schools);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const getSchoolByUuid = async (req, res) => {
    try {
        const school = await getSchoolByUuidService(req.params.uuid);
        return sendSuccess(res, 'School mil gayi', school);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const updateSchoolStatus = async (req, res) => {
    try {
        const result = await updateSchoolStatusService(req.params.uuid, req.body.status);
        return sendSuccess(res, result.message);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const deleteSchool = async (req, res) => {
    try {
        const result = await deleteSchoolService(req.params.uuid);
        return sendSuccess(res, result.message);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const createAdmin = async (req, res) => {
    try {
        const admin = await createAdminService(req.body);
        return sendSuccess(res, 'Admin successfully banaya gaya', admin, 201);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const updateAdminStatus = async (req, res) => {
    try {
        const result = await updateAdminStatusService(req.params.uuid, req.body.status);
        return sendSuccess(res, result.message);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const createSchoolWithAdmin = async (req, res) => {
    try {
        const logoUrl = req.file ? req.file.path : null;
        const school = await createSchoolWithAdminService(req.body, req.user.id, logoUrl);
        return sendSuccess(res, 'School aur Admin successfully bana diye gaye', school, 201);
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
    createSchool,
    getAllSchools,
    getSchoolByUuid,
    updateSchoolStatus,
    deleteSchool,
    createAdmin,
    updateAdminStatus,
    createSchoolWithAdmin,
    getDashboardStats,
};