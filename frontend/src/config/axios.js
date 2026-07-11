import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
});

// Request interceptor — har request mein access token daalo
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — token expire hone pe refresh karo
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const res = await axios.post(
                    'http://localhost:5000/api/auth/refresh',
                    {},
                    { withCredentials: true }
                );

                const newToken = res.data.data.accessToken;
                localStorage.setItem('accessToken', newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                return axiosInstance(originalRequest);
            } catch (err) {
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;