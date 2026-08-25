const { getActivePlansService, getAllPlansService, updatePlanService } = require('./plans.service');
const { sendSuccess, sendError } = require('../../utils/response.utils');

const getActivePlans = async (req, res) => {
    try {
        const plans = await getActivePlansService();
        return sendSuccess(res, 'Plans fetched', plans);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const getAllPlans = async (req, res) => {
    try {
        const plans = await getAllPlansService();
        return sendSuccess(res, 'All plans fetched', plans);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const updatePlan = async (req, res) => {
    try {
        const plan = await updatePlanService(req.params.id, req.body);
        return sendSuccess(res, 'Plan updated', plan);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

module.exports = { getActivePlans, getAllPlans, updatePlan };
