// Browsers treat a plain hyphen "-" as a valid point to break a line, per the
// Unicode line-breaking rules — this happens on any heading/paragraph with no
// special CSS involved. Swapping it for the "non-breaking hyphen" (U+2011)
// keeps the exact same visual character in every font, but removes that break
// opportunity, so text wraps only at spaces like normal words.
const NB_HYPHEN = '‑';

// Replaces "-" outside of HTML tags only, so URLs/attributes inside RTE HTML
// (e.g. Cloudinary URLs, which routinely contain hyphens) are left untouched.
export const noBreakHyphens = (str) => {
    if (!str || typeof str !== 'string') return str;
    if (/^https?:\/\//i.test(str.trim())) return str; // whole-string URL fields (photo, pdfUrl, etc.)
    return str
        .split(/(<[^>]*>)/g)
        .map((part, i) => (i % 2 === 0 ? part.replace(/-/g, NB_HYPHEN) : part))
        .join('');
};

// Recursively applies noBreakHyphens to every string in a module's content
// object/array, regardless of shape (each module's content JSON differs).
export const noBreakHyphensDeep = (value) => {
    if (typeof value === 'string') return noBreakHyphens(value);
    if (Array.isArray(value)) return value.map(noBreakHyphensDeep);
    if (value && typeof value === 'object') {
        const result = {};
        for (const key in value) result[key] = noBreakHyphensDeep(value[key]);
        return result;
    }
    return value;
};
