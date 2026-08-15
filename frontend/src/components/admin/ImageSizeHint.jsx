// Small caption placed under an image/file upload field telling the school admin what
// resolution/aspect will look best, based on how that field is actually displayed on the
// public site. Kept as its own component so every upload field in the admin panel renders
// this consistently.
// Every image upload across the admin panel is capped at 1MB (both server-side in
// backend/src/config/cloudinary.js and client-side in utils/fileValidation.js) — baked in
// here once so every caller automatically states the limit instead of repeating it per call site.
const ImageSizeHint = ({ children }) => (
    <p style={{
        display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px',
        color: '#94a3b8', marginTop: '8px', lineHeight: 1.55, fontWeight: 500,
    }}>
        <span style={{ flexShrink: 0, marginTop: '1px', fontSize: '11px' }}>ⓘ</span>
        <span>{children} Max 1MB per image.</span>
    </p>
);

export default ImageSizeHint;
