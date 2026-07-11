// ── Font options for school-configurable text (navbar name, hero heading) ──
// Add a new font here + to GOOGLE_FONTS_URL to make it selectable in admin Settings.
export const FONT_OPTIONS = [
    { key: 'inter', label: 'Inter', desc: 'Clean & modern', family: "'Inter', system-ui, sans-serif" },
    { key: 'poppins', label: 'Poppins', desc: 'Friendly & rounded', family: "'Poppins', sans-serif" },
    { key: 'montserrat', label: 'Montserrat', desc: 'Bold & geometric', family: "'Montserrat', sans-serif" },
    { key: 'playfair', label: 'Playfair Display', desc: 'Elegant & classic', family: "'Playfair Display', Georgia, serif" },
    { key: 'raleway', label: 'Raleway', desc: 'Light & refined', family: "'Raleway', sans-serif" },
    { key: 'merriweather', label: 'Merriweather', desc: 'Traditional serif', family: "'Merriweather', Georgia, serif" },
];

export const GOOGLE_FONTS_URL =
    "https://fonts.googleapis.com/css2?" +
    "family=Inter:wght@400;600;700;900" +
    "&family=Poppins:wght@400;600;700;900" +
    "&family=Montserrat:wght@400;600;700;900" +
    "&family=Playfair+Display:wght@700;800;900" +
    "&family=Raleway:wght@400;600;700;900" +
    "&family=Merriweather:wght@400;700;900" +
    "&display=swap";

export const getFontFamily = (key) =>
    FONT_OPTIONS.find((f) => f.key === key)?.family || FONT_OPTIONS[0].family;
