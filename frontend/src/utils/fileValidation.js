import toast from 'react-hot-toast';

// ── Single source of truth for the platform-wide 1MB image cap, enforced
// client-side (in addition to the backend's multer limit in
// backend/src/config/cloudinary.js) so uploads fail fast with a clear
// message instead of a generic "Failed to upload" toast after a round trip. ──
export const MAX_IMAGE_SIZE_MB = 1;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export const assertImageSizeOk = (file) => {
    if (file && file.size > MAX_IMAGE_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        toast.error(`Image is ${sizeMb}MB — please upload an image under ${MAX_IMAGE_SIZE_MB}MB`);
        throw new Error(`Image exceeds ${MAX_IMAGE_SIZE_MB}MB limit`);
    }
};
