import { COURSE_LEVELS } from "../utils/courseLevels";

// ── Single source of truth for theme colors used across ALL public pages ──
const THEME_COLORS_MAP = {
    default: { primary: "#8b2252", secondary: "#c9687e", light: "#fdf2f6", dark: "#2d0a1a" },
    blue:    { primary: "#1e3a5f", secondary: "#2563eb", light: "#eff6ff", dark: "#0f1e3d" },
    green:   { primary: "#064e3b", secondary: "#059669", light: "#f0fdf4", dark: "#022c22" },
    purple:  { primary: "#4a1d96", secondary: "#7c3aed", light: "#faf5ff", dark: "#1e0a3c" },
    orange:  { primary: "#7c2d12", secondary: "#ea580c", light: "#fff7ed", dark: "#3c1006" },
    dark:    { primary: "#0f0c05", secondary: "#c9a227", light: "#fefce8", dark: "#0a0800" },
};

export const getThemeColors = (theme) => THEME_COLORS_MAP[theme] || THEME_COLORS_MAP.default;

export const HOME_LINK = { key: 'home', label: 'Home', path: (slug) => `/school/${slug}` };

export const DISCLOSURE_LINK = { key: 'disclosure', label: 'Public Disclosure', path: (slug) => `/school/${slug}/public-disclosure` };

// ── Navbar top-level items ──
// Three shapes, rendered differently by Navbar.jsx:
//  - plain link:        { key, label, path }                          → no dropdown
//  - group dropdown:    { label, links: [...] }                       → dropdown listing each link;
//                        a link may itself carry `subItems` (static) or `dynamicSubItems` (fetched,
//                        see Infrastructure/Courses below) for a nested flyout on hover
//  - single flyout:      { key, label, path, subItems }                → top-level hover opens the
//                        subItems flyout directly, skipping an intermediate group row (used by Sports)
export const NAVBAR_ITEMS = [
    HOME_LINK,
    {
        label: 'About Us',
        links: [
            { key: 'about',          label: 'About Us',       path: (slug) => `/school/${slug}/about` },
            { key: 'faculty',        label: 'Faculty',        path: (slug) => `/school/${slug}/faculty` },
            { key: 'infrastructure', label: 'Infrastructure', path: (slug) => `/school/${slug}/infrastructure`, dynamicSubItems: 'infrastructure' },
            { key: 'alumni',         label: 'Alumni',         path: (slug) => `/school/${slug}/alumni` },
        ],
    },
    {
        label: 'Academics',
        links: [
            { key: 'courses',      label: 'Courses',        path: (slug) => `/school/${slug}/courses`, subItems: COURSE_LEVELS, dynamicSubItems: 'courses' },
            { key: 'fee',          label: 'Fee Structure',  path: (slug) => `/school/${slug}/fee` },
            { key: 'tc',           label: 'TC Information', path: (slug) => `/school/${slug}/tc` },
            { key: 'achievements', label: 'Achievements',   path: (slug) => `/school/${slug}/achievements` },
        ],
    },
    {
        key: 'sports', label: 'Sports', path: (slug) => `/school/${slug}/sports`,
        subItems: [
            { label: 'Sports at School', path: (slug) => `/school/${slug}/sports/sportsAt` },
            { label: 'Sports Offered',   path: (slug) => `/school/${slug}/sports/sportsOffered` },
            { label: 'Sporting Events',  path: (slug) => `/school/${slug}/sports/sportingEvents` },
            { label: 'Awards & Achievements', path: (slug) => `/school/${slug}/sports/awards` },
        ],
    },
    {
        label: 'Gallery',
        links: [
            { key: 'gallery',       label: 'Photo Gallery', path: (slug) => `/school/${slug}/gallery/photo` },
            { key: 'gallery-video', label: 'Video Gallery', path: (slug) => `/school/${slug}/gallery/video` },
        ],
    },
    DISCLOSURE_LINK,
];

// ── Footer nav — same links, grouped by heading for the footer columns ──
// Milestone 2 only. Add more headings (Student Life, Community, Admissions)
// when those modules are built in Milestone 3.
export const FOOTER_NAV_GROUPS = [
    {
        heading: 'About Us',
        links: [
            { key: 'about',          label: 'About Us',        path: (slug) => `/school/${slug}/about` },
            { key: 'faculty',        label: 'Faculty',         path: (slug) => `/school/${slug}/faculty` },
            { key: 'infrastructure', label: 'Infrastructure',  path: (slug) => `/school/${slug}/infrastructure` },
            { key: 'alumni',         label: 'Alumni',          path: (slug) => `/school/${slug}/alumni` },
            { key: 'tc',             label: 'TC Information',  path: (slug) => `/school/${slug}/tc` },
        ],
    },
    {
        heading: 'Academics',
        links: [
            { key: 'courses',     label: 'Courses',           path: (slug) => `/school/${slug}/courses` },
            { key: 'fee',         label: 'Fee Structure',     path: (slug) => `/school/${slug}/fee` },
            { key: 'disclosure',  label: 'Public Disclosure', path: (slug) => `/school/${slug}/public-disclosure` },
        ],
    },
    {
        heading: 'Highlights',
        links: [
            { key: 'sports',       label: 'Sports',       path: (slug) => `/school/${slug}/sports` },
            { key: 'gallery',      label: 'Gallery',      path: (slug) => `/school/${slug}/gallery/photo` },
            { key: 'achievements', label: 'Achievements', path: (slug) => `/school/${slug}/achievements` },
        ],
    },
];
