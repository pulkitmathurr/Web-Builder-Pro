import axiosInstance from '../config/axios';

export const submitSignupApi = async (data) => {
    const response = await axiosInstance.post('/signup', data);
    return response.data;
};
