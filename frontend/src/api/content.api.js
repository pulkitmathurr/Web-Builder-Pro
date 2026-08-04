import axiosInstance from '../config/axios';
import { noBreakHyphensDeep } from '../utils/textFormat';

export const getModuleContentApi = async (moduleKey) => {
    const response = await axiosInstance.get(`/content/${moduleKey}`);
    return response.data;
};

export const saveModuleContentApi = async (moduleKey, content, isPublished = 0) => {
    const response = await axiosInstance.post(`/content/${moduleKey}`, { content: noBreakHyphensDeep(content), isPublished });
    return response.data;
};

export const togglePublishApi = async (moduleKey, isPublished) => {
    const response = await axiosInstance.patch(`/content/${moduleKey}/publish`, { isPublished });
    return response.data;
};

export const getPublicModuleContentApi = async (schoolId, moduleKey) => {
    const response = await axiosInstance.get(`/content/public/${schoolId}/${moduleKey}`);
    return response.data;
};

export const getPublishedModulesApi = async (schoolId) => {
    const response = await axiosInstance.get(`/content/public/${schoolId}/modules/published`);
    return response.data;
};

export const uploadContentImageApi = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axiosInstance.post('/content/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const uploadPdfApi = async (file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    const response = await axiosInstance.post('/content/upload-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};


export const uploadVideoFileApi = async (file) => {
    const formData = new FormData();
    formData.append('video', file);
    const response = await axiosInstance.post('/content/upload-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};