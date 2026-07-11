import { create } from 'zustand';
import { getSchoolProfileApi } from '../api/school.api';
import { getThemeColors } from '../constants/publicNav';

// Drives the School Admin panel's brand colors (sidebar accents, header
// gradients, buttons) from the same school.theme value used on the public
// website, so the admin UI and the public site always match.
const useSchoolStore = create((set) => ({
    school: null,
    tc: getThemeColors(null),
    loaded: false,

    fetchSchool: async () => {
        try {
            const res = await getSchoolProfileApi();
            const school = res.data;
            set({ school, tc: getThemeColors(school.theme), loaded: true });
        } catch (e) {
            set({ loaded: true });
        }
    },

    setTheme: (theme) => {
        set((state) => ({
            school: state.school ? { ...state.school, theme } : state.school,
            tc: getThemeColors(theme),
        }));
    },
}));

export default useSchoolStore;
