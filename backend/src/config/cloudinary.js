const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Image upload (small — logos, profile photos)
const imageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'school-saas/schools',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
    },
});

// Content image upload (bigger — banners, gallery, module content)
const contentImageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'school-saas/content',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1920, height: 1920, crop: 'limit', quality: 'auto' }],
    },
});

// PDF upload — NOTE: this Cloudinary account has the "Restricted media types"
// security default ON, which blocks public *delivery* of PDF/ZIP files entirely
// (visitors get a 401 "deny or ACL failure" placeholder instead of the real file,
// which is why downloads were coming through empty/wrong-format rather than a
// real PDF). This is an account-level Cloudinary setting, not something fixable
// from upload code — resource_type (raw vs image) and URL flags like
// fl_attachment were both tested and neither bypasses it. Fix: in the Cloudinary
// dashboard, Settings -> Security -> disable "Restricted media types" (or enable
// "Allow delivery of PDF and ZIP files"). The public_id below is still forced to
// end in ".pdf" so filenames are clean once delivery is unblocked.
const pdfStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'school-saas/documents',
        resource_type: 'raw',
        allowed_formats: ['pdf'],
        public_id: (req, file) => `${Date.now()}-${file.originalname.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`,
    },
});

// Video upload
const videoStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'school-saas/videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'webm', 'mov'],
        transformation: [{ quality: 'auto', fetch_format: 'mp4' }],
    },
});

const upload = multer({
    storage: imageStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
});

const uploadContentImage = multer({
    storage: contentImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadPdf = multer({
    storage: pdfStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

const uploadVideo = multer({
    storage: videoStorage,
    limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = { cloudinary, upload, uploadContentImage, uploadPdf, uploadVideo };