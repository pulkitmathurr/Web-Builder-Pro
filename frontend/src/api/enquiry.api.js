import axiosInstance from '../config/axios';

export const submitEnquiryApi = async (schoolId, payload) => {
    const response = await axiosInstance.post(`/enquiry/public/${schoolId}`, payload);
    return response.data;
};

export const getEnquiriesApi = async (type) => {
    const response = await axiosInstance.get(`/enquiry/${type}`);
    return response.data;
};

export const updateEnquiryStatusApi = async (uuid, status) => {
    const response = await axiosInstance.patch(`/enquiry/${uuid}/status`, { status });
    return response.data;
};

export const deleteEnquiryApi = async (uuid) => {
    const response = await axiosInstance.delete(`/enquiry/${uuid}`);
    return response.data;
};
