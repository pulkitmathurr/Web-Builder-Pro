import axiosInstance from '../config/axios';

// ── Public ────────────────────────────────────────────
export const getActivePlansApi = async () => {
    const response = await axiosInstance.get('/plans');
    return response.data;
};

// ── Super Admin ───────────────────────────────────────
export const getAllPlansApi = async () => {
    const response = await axiosInstance.get('/plans/all');
    return response.data;
};

export const createPlanApi = async (data) => {
    const response = await axiosInstance.post('/plans', data);
    return response.data;
};

export const updatePlanApi = async (id, data) => {
    const response = await axiosInstance.patch(`/plans/${id}`, data);
    return response.data;
};

export const deletePlanApi = async (id) => {
    const response = await axiosInstance.delete(`/plans/${id}`);
    return response.data;
};
