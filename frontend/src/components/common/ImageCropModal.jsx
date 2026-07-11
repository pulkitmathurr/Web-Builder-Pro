import { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// aspect = width/height ratio for the crop box, e.g. 16/9 for banners, 1 for square.
// Pass aspect={null} to allow free-form cropping (no fixed ratio).
const ImageCropModal = ({ imageSrc, aspect = 16 / 9, onCancel, onCropComplete }) => {
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState();
    const imgRef = useRef(null);

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        if (aspect) {
            const newCrop = centerCrop(
                makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
                width,
                height
            );
            setCrop(newCrop);
        } else {
            setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
        }
    };

    const getCroppedFile = async () => {
        const image = imgRef.current;
        if (!image || !completedCrop) return null;

        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) { resolve(null); return; }
                const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
                resolve(file);
            }, 'image/jpeg', 0.92);
        });
    };

    const handleConfirm = async () => {
        const file = await getCroppedFile();
        if (file) onCropComplete(file);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 5000,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem',
        }}>
            <div style={{
                background: '#ffffff', borderRadius: '20px', overflow: 'hidden',
                maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
            }}>
                {/* Header */}
                <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>Crop Image</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>Drag to select the area you want to use</p>
                    </div>
                    <button onClick={onCancel}
                        style={{ width: '32px', height: '32px', background: '#f8fafc', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                {/* Crop area */}
                <div style={{ padding: '1.5rem', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', flex: 1 }}>
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={aspect}
                    >
                        <img ref={imgRef} src={imageSrc} onLoad={onImageLoad} alt="Crop preview" style={{ maxHeight: '60vh', display: 'block' }} />
                    </ReactCrop>
                </div>

                {/* Footer */}
                <div style={{ padding: '1.25rem 1.75rem', borderTop: '0.5px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onCancel}
                        style={{ padding: '10px 20px', background: '#f8fafc', color: '#64748b', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                        Cancel
                    </button>
                    <button onClick={handleConfirm}
                        style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#8b2252,#c9687e)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(139,34,82,0.3)' }}>
                        ✓ Use This Crop
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropModal;