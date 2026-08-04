import { useState } from 'react';
import toast from 'react-hot-toast';
import { uploadContentImageApi } from '../../api/content.api';
import useSchoolStore from '../../store/schoolStore';
import { normalizeImages, getImageUrl, getImageOrientation } from '../../utils/imageOrientation';
import ImageSizeHint from './ImageSizeHint';
import ImageCropModal from '../common/ImageCropModal';

const LandscapeIcon = () => (
    <svg width="14" height="11" viewBox="0 0 16 12" fill="none">
        <rect x="0.75" y="0.75" width="14.5" height="10.5" rx="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

const PortraitIcon = () => (
    <svg width="11" height="14" viewBox="0 0 12 16" fill="none">
        <rect x="0.75" y="0.75" width="10.5" height="14.5" rx="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

// ── Gallery-style multi-image editor used anywhere a module lets an admin attach a small
// photo set — Announcements' `images` and Events' highlight `images`. Each selected photo is
// cropped one at a time (freeform, adjustable from every side — same pattern as every other
// bulk image field in this app, e.g. Home Page banners) before it's uploaded; once confirmed,
// the next queued file automatically opens in the crop modal. After upload, each photo also
// carries its own Horizontal/Vertical tag so the public mosaic can size that photo's frame to
// match instead of force-cropping every photo into one landscape box — set via the floating
// icon pill over the photo (Canva/Google Photos style) rather than a button row under it. ──
const OrientedImagesEditor = ({ images, onChange, max = 5 }) => {
    const { tc } = useSchoolStore();
    const [uploading, setUploading] = useState(false);
    const [cropSrc, setCropSrc] = useState(null);
    const [imageQueue, setImageQueue] = useState([]); // remaining files still waiting to be cropped
    const items = normalizeImages(images);

    const handleFilesSelected = (e) => {
        const room = max - items.length;
        const files = Array.from(e.target.files || []).slice(0, room);
        e.target.value = '';
        if (files.length === 0) return;
        setImageQueue(files.slice(1));
        setCropSrc(URL.createObjectURL(files[0]));
    };

    const onCropConfirmed = async (croppedFile) => {
        setCropSrc(null);
        setUploading(true);
        try {
            const res = await uploadContentImageApi(croppedFile);
            onChange([...items, { url: res.data.url, orientation: 'horizontal' }]);
        } catch (e) { toast.error('Failed to upload image'); }
        finally {
            setUploading(false);
            if (imageQueue.length > 0) {
                const [next, ...rest] = imageQueue;
                setImageQueue(rest);
                setCropSrc(URL.createObjectURL(next));
            }
        }
    };

    const removeAt = (idx) => onChange(items.filter((_, i) => i !== idx));
    const setOrientation = (idx, orientation) => onChange(items.map((it, i) => i === idx ? { ...it, orientation } : it));

    return (
        <>
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {items.map((img, i) => {
                    const orientation = getImageOrientation(img);
                    return (
                        <div key={i} className="oi-thumb" style={{
                            position: 'relative', width: '112px', height: '112px', borderRadius: '14px', overflow: 'hidden',
                            border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(15,23,42,0.07)', background: '#f1f5f9',
                        }}>
                            <img src={getImageUrl(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,23,42,0.32) 0%, transparent 26%, transparent 68%, rgba(15,23,42,0.5) 100%)', pointerEvents: 'none' }} />

                            {max > 1 && (
                                <span style={{ position: 'absolute', top: '6px', left: '6px', fontSize: '9px', fontWeight: 700, color: '#fff', background: 'rgba(15,23,42,0.55)', borderRadius: '5px', padding: '1.5px 6px' }}>{i + 1}</span>
                            )}
                            <button type="button" onClick={() => removeAt(i)} className="oi-remove"
                                style={{ position: 'absolute', top: '5px', right: '5px', width: '20px', height: '20px', borderRadius: '7px', border: 'none', background: 'rgba(15,23,42,0.55)', color: '#fff', fontSize: '12px', cursor: 'pointer', lineHeight: 1 }}>×</button>

                            {/* Floating orientation pill — segmented icon toggle over the photo itself */}
                            <div className="oi-orient-pill" style={{
                                position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)',
                                display: 'flex', alignItems: 'center', gap: '2px', padding: '3px',
                                background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                                borderRadius: '999px', boxShadow: '0 2px 10px rgba(0,0,0,0.28)',
                            }}>
                                <button type="button" onClick={() => setOrientation(i, 'horizontal')} title="Horizontal photo" className="oi-orient-btn"
                                    style={{
                                        width: '26px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        borderRadius: '999px', border: 'none', cursor: 'pointer',
                                        background: orientation === 'horizontal' ? '#ffffff' : 'transparent',
                                        color: orientation === 'horizontal' ? tc.primary : 'rgba(255,255,255,0.8)',
                                    }}>
                                    <LandscapeIcon />
                                </button>
                                <button type="button" onClick={() => setOrientation(i, 'vertical')} title="Vertical photo" className="oi-orient-btn"
                                    style={{
                                        width: '26px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        borderRadius: '999px', border: 'none', cursor: 'pointer',
                                        background: orientation === 'vertical' ? '#ffffff' : 'transparent',
                                        color: orientation === 'vertical' ? tc.primary : 'rgba(255,255,255,0.8)',
                                    }}>
                                    <PortraitIcon />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {items.length < max && (
                    <label style={{ width: '112px', height: '112px', borderRadius: '14px', border: `1.5px dashed ${tc.primary}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10.5px', color: tc.primary, fontWeight: 700, textAlign: 'center', background: `${tc.primary}06`, transition: 'background 0.2s ease, border-color 0.2s ease' }}>
                        {uploading ? 'Uploading...' : '+ Add Photo'}
                        <input type="file" accept="image/*" multiple={max > 1} style={{ display: 'none' }}
                            onChange={handleFilesSelected} />
                    </label>
                )}
            </div>
            <ImageSizeHint>
                {items.length}/{max} photo{max > 1 ? 's' : ''}. You'll get a crop tool (freely adjustable from every side)
                before each photo is added, then use the Horizontal/Vertical toggle on the photo to mark its orientation
                so it displays uncropped on the site. Best results: horizontal photos ≈ 1600×900px (16:9 landscape),
                vertical photos ≈ 1200×1600px (3:4 portrait).
            </ImageSizeHint>
            <style>{`
                .oi-thumb { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
                .oi-thumb:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(15,23,42,0.16); border-color: #cbd5e1; }
                .oi-remove { transition: transform 0.18s ease, background 0.18s ease; }
                .oi-remove:hover { transform: scale(1.1); background: rgba(220,38,38,0.85); }
                .oi-orient-btn { transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease; }
                .oi-orient-btn:hover { transform: scale(1.08); }
                .oi-orient-pill { transition: box-shadow 0.2s ease; }
                .oi-thumb:hover .oi-orient-pill { box-shadow: 0 4px 14px rgba(0,0,0,0.35); }
            `}</style>
        </div>
        {cropSrc && (
            <ImageCropModal
                imageSrc={cropSrc}
                aspect={null}
                onCancel={() => { setCropSrc(null); setImageQueue([]); }}
                onCropComplete={onCropConfirmed}
            />
        )}
        </>
    );
};

export default OrientedImagesEditor;
