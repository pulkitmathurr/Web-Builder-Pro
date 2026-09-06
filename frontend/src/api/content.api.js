import axiosInstance from '../config/axios';
import { noBreakHyphensDeep } from '../utils/textFormat';
import { assertImageSizeOk } from '../utils/fileValidation';
import { compressImage } from '../utils/compressImage';

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

// Every module admin page lives at /admin/module/:key (dedicated or generic
// ModulePage route alike — see App.jsx), so the current module can be read straight
// off the URL here instead of threading a moduleKey prop through every upload call
// site across ~20 module pages. Used to attribute storage usage per module on the
// dashboard's usage bar; falls back to no module (bucketed as "other" server-side)
// on pages outside that pattern (e.g. Settings).
const currentModuleKey = () => window.location.pathname.match(/\/admin\/module\/([^/]+)/)?.[1] || '';

export const uploadContentImageApi = async (file) => {
    assertImageSizeOk(file);
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append('image', compressed);
    const response = await axiosInstance.post(`/content/upload-image?moduleKey=${currentModuleKey()}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const uploadPdfApi = async (file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    const response = await axiosInstance.post(`/content/upload-pdf?moduleKey=${currentModuleKey()}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};


export const uploadVideoFileApi = async (file) => {
    const formData = new FormData();
    formData.append('video', file);
    const response = await axiosInstance.post(`/content/upload-video?moduleKey=${currentModuleKey()}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};