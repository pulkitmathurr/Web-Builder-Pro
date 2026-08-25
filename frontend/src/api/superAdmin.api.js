import axiosInstance from '../config/axios';

// ── Schools ──────────────────────────────────────────
export const getAllSchoolsApi = async () => {
    const response = await axiosInstance.get('/super-admin/schools');
    return response.data;
};

export const getSchoolByUuidApi = async (uuid) => {
    const response = await axiosInstance.get(`/super-admin/schools/${uuid}`);
    return response.data;
};

export const createSchoolApi = async (schoolData) => {
    const response = await axiosInstance.post('/super-admin/schools', schoolData);
    return response.data;
};

export const updateSchoolStatusApi = async (uuid, status) => {
    const response = await axiosInstance.patch(
        `/super-admin/schools/${uuid}/status`,
        { status }
    );
    return response.data;
};

export const deleteSchoolApi = async (uuid) => {
    const response = await axiosInstance.delete(`/super-admin/schools/${uuid}`);
    return response.data;
};

// ── Admins ───────────────────────────────────────────
export const createAdminApi = async (adminData) => {
    const response = await axiosInstance.post('/super-admin/admins', adminData);
    return response.data;
};

export const updateAdminStatusApi = async (uuid, status) => {
    const response = await axiosInstance.patch(
        `/super-admin/admins/${uuid}/status`,
        { status }
    );
    return response.data;
};

export const createSchoolWithAdminApi = async (data) => {
    const response = await axiosInstance.post(
        '/super-admin/schools/create-with-admin',
        data,
        {
            headers: { 'Content-Type': 'multipart/form-data' }
        }
    );
    return response.data;
};

export const getDashboardStatsApi = async () => {
    const response = await axiosInstance.get('/super-admin/dashboard-stats');
    return response.data;
};

// ── Approval Queue ───────────────────────────────────
export const getPendingSchoolsApi = async () => {
    const response = await axiosInstance.get('/super-admin/pending-schools');
    return response.data;
};

export const approveSchoolApi = async (uuid) => {
    const response = await axiosInstance.patch(`/super-admin/schools/${uuid}/approve`);
    return response.data;
};

export const rejectSchoolApi = async (uuid) => {
    const response = await axiosInstance.patch(`/super-admin/schools/${uuid}/reject`);
    return response.data;
};

export const assignPlanApi = async (uuid, planId) => {
    const response = await axiosInstance.patch(`/super-admin/schools/${uuid}/assign-plan`, { planId });
    return response.data;
};