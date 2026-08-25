import axiosInstance from '../config/axios';

export const createBillingOrderApi = async (planId) => {
    const response = await axiosInstance.post('/billing/create-order', { planId });
    return response.data;
};

export const verifyBillingPaymentApi = async (paymentData) => {
    const response = await axiosInstance.post('/billing/verify-payment', paymentData);
    return response.data;
};
