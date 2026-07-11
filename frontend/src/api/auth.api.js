import axiosInstance from '../config/axios';

export const loginApi = async (email, password, role) => {
    const response = await axiosInstance.post('/auth/login', {
        email,
        password,
        role
    });
    return response.data;
};

export const logoutApi = async () => {
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
};

export const refreshTokenApi = async () => {
    const response = await axiosInstance.post('/auth/refresh');
    return response.data;
};