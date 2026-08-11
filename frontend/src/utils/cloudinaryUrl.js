// ── Forces a clean, predictable download filename via Cloudinary's fl_attachment
// flag — without this, some raw-resource PDFs download using Cloudinary's random
// internal public_id (e.g. "f1lf67mozfzknmykvzi8") as the filename instead of
// something readable, regardless of what the underlying asset is actually named.
// Used by any public page that lets a visitor download a Cloudinary-hosted PDF. ──
export const cloudinaryAttachmentUrl = (url, label) => {
    if (!url || !url.includes('/upload/')) return url;
    const safe = (label || 'document').trim().replace(/[^a-zA-Z0-9-_ ]+/g, '').replace(/\s+/g, '-') || 'document';
    return url.replace('/upload/', `/upload/fl_attachment:${safe}/`);
};
