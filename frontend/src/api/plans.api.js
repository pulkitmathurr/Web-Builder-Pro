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

export const updatePlanApi = async (id, data) => {
    const response = await axiosInstance.patch(`/plans/${id}`, data);
    return response.data;
};
