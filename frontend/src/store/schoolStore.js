import { create } from 'zustand';
import { getSchoolProfileApi } from '../api/school.api';
import { getThemeColors, getBaseColors } from '../constants/publicNav';

// Drives the School Admin panel's brand colors (sidebar accents, header
// gradients, buttons) from the same school.theme value used on the public
// website, so the admin UI and the public site always match. `bc` mirrors
// this for school.base_theme (surface/card backgrounds), so the admin
// panel's own background also reflects the school's chosen base color.
const useSchoolStore = create((set) => ({
    school: null,
    tc: getThemeColors(null),
    bc: getBaseColors(null),
    loaded: false,

    fetchSchool: async () => {
        try {
            const res = await getSchoolProfileApi();
            const school = res.data;
            set({ school, tc: getThemeColors(school.theme), bc: getBaseColors(school.base_theme), loaded: true });
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

    setBaseTheme: (base_theme) => {
        set((state) => ({
            school: state.school ? { ...state.school, base_theme } : state.school,
            bc: getBaseColors(base_theme),
        }));
    },
}));

export default useSchoolStore;
