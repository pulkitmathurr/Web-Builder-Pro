import imageCompression from 'browser-image-compression';

// ── Platform-wide client-side image compression ──────────────────────────────
// Runs before every image upload (wired into the *.api.js upload helpers) so a
// raw phone photo (typically 3-8MB) is shrunk to well under the backend's multer
// cap instead of being rejected outright, and so slow connections push far fewer
// bytes over the wire. Cloudinary still applies its own resize + quality:auto on
// top of this server-side (see backend/src/config/cloudinary.js) — this is an
// extra, earlier pass, not a replacement.

const DEFAULT_OPTS = {
    maxSizeMB: 0.9,          // aim just under the ~1-2MB server multer cap
    maxWidthOrHeight: 1920,  // matches contentImageStorage's resize ceiling
    useWebWorker: true,      // keep the UI responsive on big images
};

// Returns a compressed File. Never throws — on any failure (odd format, worker
// error, etc.) it falls back to the original file so an upload is never broken
// just because compression choked.
export const compressImage = async (file, overrides = {}) => {
    if (!(file instanceof File) || !file.type?.startsWith('image/')) return file;
    // Animated GIFs lose their animation on a canvas re-encode — leave them be.
    if (file.type === 'image/gif') return file;
    try {
        const out = await imageCompression(file, { ...DEFAULT_OPTS, ...overrides });
        // Already-optimised small images can come out larger — keep the smaller one.
        return out.size < file.size ? out : file;
    } catch (err) {
        console.error('[compressImage] falling back to original file:', err);
        return file;
    }
};

// Mutates a FormData in place: compresses whatever image File is stored under
// `key`. Used by the school/super-admin upload helpers that build their own
// FormData before calling the API.
export const compressFormDataImage = async (formData, key, overrides) => {
    const file = formData.get(key);
    if (file instanceof File) {
        formData.set(key, await compressImage(file, overrides));
    }
};
