// Small caption placed under an image/file upload field telling the school admin what
// resolution/aspect will look best, based on how that field is actually displayed on the
// public site. Kept as its own component so every upload field in the admin panel renders
// this consistently.
const ImageSizeHint = ({ children }) => (
    <p style={{
        display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px',
        color: '#94a3b8', marginTop: '8px', lineHeight: 1.55, fontWeight: 500,
    }}>
        <span style={{ flexShrink: 0, marginTop: '1px', fontSize: '11px' }}>ⓘ</span>
        <span>{children}</span>
    </p>
);

export default ImageSizeHint;
