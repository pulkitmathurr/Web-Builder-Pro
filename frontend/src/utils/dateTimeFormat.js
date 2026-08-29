// Rich-text/description processing elsewhere in the app substitutes non-breaking hyphens
// (U+2010–U+2015, U+2212) into plain strings; normalize before Date parsing or ISO dates silently fail.
// Exported so callers with a full ISO timestamp (e.g. `createdAt`) can normalize it themselves
// before `new Date(...)` — parseDate()/formatDate() below assume a bare YYYY-MM-DD date.
export const normalizeDashes = (str) => str.replace(/[‐-―−]/g, '-');

export const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(`${normalizeDashes(dateStr)}T00:00:00`);
    return isNaN(d) ? null : d;
};

export const formatDate = (dateStr) => {
    const d = parseDate(dateStr);
    if (!d) return { day: '--', month: '', year: '' };
    return {
        day: d.getDate().toString().padStart(2, '0'),
        month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        year: d.getFullYear(),
    };
};

export const shortDate = (dateStr) => {
    const d = parseDate(dateStr);
    if (!d) return null;
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
};

export const relativeLabel = (dateStr) => {
    const d = parseDate(dateStr);
    if (!d) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - d) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatTime = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
};

export const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
};

export const toDateKey = (date) => {
    if (!date) return null;
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const readingTime = (html) => {
    const words = stripHtml(html).split(' ').filter(Boolean).length;
    if (!words) return null;
    return Math.max(1, Math.round(words / 200));
};
