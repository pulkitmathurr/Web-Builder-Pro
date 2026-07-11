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

// PDF upload
const pdfStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'school-saas/documents',
        resource_type: 'raw',
        allowed_formats: ['pdf'],
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