import axiosInstance from '../config/axios';
import { assertImageSizeOk } from '../utils/fileValidation';

// ── Profile ──────────────────────────────────────────
export const getSchoolProfileApi = async () => {
    const response = await axiosInstance.get('/school/profile');
    return response.data;
};

export const updateSchoolProfileApi = async (profileData) => {
    const response = await axiosInstance.put('/school/profile', profileData);
    return response.data;
};

// ── Settings ─────────────────────────────────────────
export const updateSchoolSettingsApi = async (settingsData) => {
    const response = await axiosInstance.put('/school/settings', settingsData);
    return response.data;
};

// ── Modules ──────────────────────────────────────────
export const getSelectedModulesApi = async () => {
    const response = await axiosInstance.get('/school/modules');
    return response.data;
};

export const selectModulesApi = async (modules) => {
    const response = await axiosInstance.post('/school/modules', { modules });
    return response.data;
};

export const getPublicSchoolApi = async (slug) => {
    const response = await axiosInstance.get(`/school/public/${slug}`);
    return response.data;
};

// Resolves a hostname (e.g. www.theirschool.com) to the school it belongs to, if any
// school has connected that domain via Settings -> Custom Domain.
export const resolveSchoolByDomainApi = async (domain) => {
    const response = await axiosInstance.get(`/school/public-domain/${domain}`);
    return response.data;
};

export const uploadHeroVideoApi = async (formData) => {
    const response = await axiosInstance.post('/school/hero-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const uploadSchoolLogoApi = async (formData) => {
    assertImageSizeOk(formData.get('schoolLogo'));
    const response = await axiosInstance.post('/school/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const uploadWelcomeBannerApi = async (formData) => {
    assertImageSizeOk(formData.get('welcomeBanner'));
    const response = await axiosInstance.post('/school/welcome-banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const uploadFooterBackgroundApi = async (formData) => {
    assertImageSizeOk(formData.get('footerBg'));
    const response = await axiosInstance.post('/school/footer-bg', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const uploadProspectusApi = async (formData) => {
    const response = await axiosInstance.post('/school/prospectus', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

// ── Storage Usage ─────────────────────────────────────
export const getStorageUsageApi = async () => {
    const response = await axiosInstance.get('/school/storage-usage');
    return response.data;
};
