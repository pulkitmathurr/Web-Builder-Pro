import toast from 'react-hot-toast';

// ── Pre-compression image input ceiling. Every image upload is now auto-shrunk
// client-side to ~1MB before it's sent (see utils/compressImage.js), so this is
// no longer the real size gate — it only rejects files so huge that loading them
// into a canvas would hang the browser. The backend's multer limit in
// backend/src/config/cloudinary.js is the actual server-side cap. ──
export const MAX_IMAGE_SIZE_MB = 20;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export const assertImageSizeOk = (file) => {
    if (file && file.size > MAX_IMAGE_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        toast.error(`Image is too large (${sizeMb}MB) — please use an image under ${MAX_IMAGE_SIZE_MB}MB`);
        throw new Error(`Image exceeds ${MAX_IMAGE_SIZE_MB}MB limit`);
    }
};

// ── Home page hero video cap — mirrors the backend's dedicated uploadHeroVideo
// multer config (backend/src/config/cloudinary.js), kept tighter than the
// general content-video uploader other modules (e.g. Events) still use. ──
export const MAX_HERO_VIDEO_SIZE_MB = 5;
const MAX_HERO_VIDEO_SIZE_BYTES = MAX_HERO_VIDEO_SIZE_MB * 1024 * 1024;

export const assertHeroVideoSizeOk = (file) => {
    if (file && file.size > MAX_HERO_VIDEO_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        toast.error(`Video size is too big (${sizeMb}MB) — please compress it to under ${MAX_HERO_VIDEO_SIZE_MB}MB and try again`);
        throw new Error(`Video exceeds ${MAX_HERO_VIDEO_SIZE_MB}MB limit`);
    }
};

// ── Events & Activities page video cap (both event-level and highlight-level
// video slots share VideoSlotsEditor) — client-side only. The backend's shared
// upload-video route (uploadVideo) is also capped at 5MB now, so this just
// gives a fast, clear client-side message instead of a round-trip 413. ──
export const MAX_EVENTS_VIDEO_SIZE_MB = 5;
const MAX_EVENTS_VIDEO_SIZE_BYTES = MAX_EVENTS_VIDEO_SIZE_MB * 1024 * 1024;

export const assertEventsVideoSizeOk = (file) => {
    if (file && file.size > MAX_EVENTS_VIDEO_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        toast.error(`Video size is too big (${sizeMb}MB) — please compress it to under ${MAX_EVENTS_VIDEO_SIZE_MB}MB and try again`);
        throw new Error(`Video exceeds ${MAX_EVENTS_VIDEO_SIZE_MB}MB limit`);
    }
};
