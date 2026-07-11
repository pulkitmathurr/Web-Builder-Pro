const {
    getModuleContentService,
    saveModuleContentService,
    togglePublishService,
    getPublicModuleContentService,
} = require('./content.service');
const { sendSuccess, sendError } = require('../../utils/response.utils');

const getModuleContent = async (req, res) => {
    try {
        const content = await getModuleContentService(req.user.schoolId, req.params.moduleKey);
        return sendSuccess(res, 'Content fetched', content);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const saveModuleContent = async (req, res) => {
    try {
        const { content, isPublished } = req.body;
        const result = await saveModuleContentService(
            req.user.schoolId,
            req.params.moduleKey,
            content,
            isPublished ?? 0
        );
        return sendSuccess(res, 'Content saved', result);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const togglePublish = async (req, res) => {
    try {
        const result = await togglePublishService(
            req.user.schoolId,
            req.params.moduleKey,
            req.body.isPublished
        );
        return sendSuccess(res, 'Publish status updated', result);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const getPublicModuleContent = async (req, res) => {
    try {
        const content = await getPublicModuleContentService(
            req.params.schoolId,
            req.params.moduleKey
        );
        return sendSuccess(res, 'Public content fetched', content);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const uploadContentImageHandler = async (req, res) => {
    try {
        if (!req.file) {
            return sendError(res, 'No image uploaded', 400);
        }
        return sendSuccess(res, 'Image uploaded', { url: req.file.path });
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const uploadPdfHandler = async (req, res) => {
    try {
        if (!req.file) {
            return sendError(res, 'No PDF uploaded', 400);
        }
        return sendSuccess(res, 'PDF uploaded', { url: req.file.path });
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const uploadVideoHandler = async (req, res) => {
    try {
        if (!req.file) {
            return sendError(res, 'No video uploaded', 400);
        }
        return sendSuccess(res, 'Video uploaded', { url: req.file.path });
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

module.exports = {
    getModuleContent,
    saveModuleContent,
    togglePublish,
    getPublicModuleContent,
    uploadContentImageHandler,
    uploadPdfHandler,
    uploadVideoHandler,
};