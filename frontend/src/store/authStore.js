import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            role: null,
            isAuthenticated: false,

            setAuth: (user, role, token) => {
                localStorage.setItem('accessToken', token);
                set({ user, role, isAuthenticated: true });
            },

            clearAuth: () => {
                localStorage.removeItem('accessToken');
                set({ user: null, role: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);

export default useAuthStore;