import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadContentImageApi } from '../../../api/content.api';
import RichTextEditor from '../../../components/common/RichTextEditor';
import ImageCropModal from '../../../components/common/ImageCropModal';
import ItalicToggle from '../../../components/common/ItalicToggle';
import HeadingStyleField from '../../../components/common/HeadingStyleField';
import ReorderButtons from '../../../components/common/ReorderButtons';
import useSchoolStore from '../../../store/schoolStore';
import { moveItem } from '../../../utils/reorder';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const defaultContent = { heading: '', description: '', alumni: [] };

const Alumni = () => {
    const { tc, bc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [uploading, setUploading] = useState({});

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('alumni');
            if (res.data) {
                const merged = { ...defaultContent, ...res.data.content };
                setContent(merged);
                setSavedSnapshot(JSON.stringify(merged));
                setIsPublished(res.data.is_published === 1);
            }
        } catch (e) {
            console.log('No content yet');
        } finally {
            setLoading(false);
        }
    };

    const fetchPublishedFlag = async () => {
        const res = await getModuleContentApi('alumni');
        return !!res?.data?.is_published;
    };

    const handleSave = async (publish = false) => {
        publish ? setPublishing(true) : setSaving(true);
        try {
            await saveModuleContentApi('alumni', content, publish ? 1 : isPublished ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                let current = await fetchPublishedFlag();
                if (!current) {
                    await togglePublishApi('alumni', 1);
                    current = await fetchPublishedFlag();
                }
                setIsPublished(current);
                toast.success('Alumni page published! 🎉');
            }
            else toast.success('Saved!');
        } catch (e) {
            toast.error('Failed to save');
        } finally {
            setSaving(false); setPublishing(false);
        }
    };

    const handleUnpublish = async () => {
        try {
            let current = await fetchPublishedFlag();
            if (current) {
                await togglePublishApi('alumni', 0);
                current = await fetchPublishedFlag();
            }
            setIsPublished(current);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed'); }
    };

    const updateField = (field, value) => setContent(prev => ({ ...prev, [field]: value }));

    const inputStyle = {
        width: '100%', padding: '11px 14px', border: '1px solid #e5e9f0',
        borderRadius: '10px', fontSize: '13.5px', color: '#0f172a', outline: 'none',
        boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'system-ui, sans-serif',
        transition: 'border 0.2s, box-shadow 0.2s, background 0.2s',
    };

    const labelStyle = {
        display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
    };

    const isDirty = savedSnapshot !== null && JSON.stringify(content) !== savedSnapshot;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes drift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-24px, 18px) scale(1.08); } }
                .alumni-section { animation: fadeInUp 0.35s ease forwards; }
                @media (max-width: 600px) {
                    .alumni-photo-grid { grid-template-columns: 1fr !important; }
                }
                .alumni-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .alumni-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .alumni-hero-orb { animation: drift1 9s ease-in-out infinite; }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif', background: bc.surface, margin: '-24px', padding: '24px', minHeight: '100vh' }}>

                {/* Hero Header */}
                <div style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '22px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                    <div className="alumni-hero-orb" style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: '-140px', right: '4%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="alumni-hero-item">
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Pages / Alumni</p>
                            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Alumni</h1>
                            <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px' }}>
                                Showcase notable alumni — their journey since graduating and where they are now.
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '6px', flexShrink: 0 }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8' }}></div>
                            <span style={{ fontSize: '12px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{isPublished ? 'Published' : 'Draft'}</span>
                        </div>
                    </div>
                </div>

                {/* Top Action Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '1.25rem' }}>
                    <button onClick={() => updateField('alumni', [{
                        id: `alum-${Date.now()}`, photo: '', name: '', batchYear: '', achievementHeadline: '', testimonial: '', linkedinUrl: ''
                    }, ...content.alumni])}
                        style={{ padding: '11px 20px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                        + Add Alumnus
                    </button>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleSave(false)} disabled={saving}
                            style={{ padding: '11px 24px', background: isDirty ? '#fefce8' : '#ffffff', color: isDirty ? '#a16207' : '#64748b', border: isDirty ? '1px solid #fde68a' : '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontWeight: isDirty ? 700 : 500, cursor: 'pointer' }}>
                            {saving ? 'Saving...' : isDirty ? '● Save' : 'Save'}
                        </button>
                        {isPublished ? (
                            <button onClick={handleUnpublish}
                                style={{ padding: '11px 24px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                                Unpublish
                            </button>
                        ) : (
                            <button onClick={() => handleSave(true)} disabled={publishing}
                                style={{ padding: '11px 28px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}` }}>
                                {publishing ? 'Publishing...' : 'Publish'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="alumni-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Top section */}
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div>
                            <label style={labelStyle}>Heading</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="alumni-input" type="text" value={content.heading} onChange={e => updateField('heading', e.target.value)}
                                    placeholder="Enter Heading" style={{ ...inputStyle, fontStyle: content.headingItalic ? 'italic' : 'normal' }} />
                                <ItalicToggle active={!!content.headingItalic} onToggle={() => updateField('headingItalic', !content.headingItalic)} />
                            </div>
                            <HeadingStyleField
                                color={content.headingColor} onColorChange={val => updateField('headingColor', val)}
                                font={content.headingFont} onFontChange={val => updateField('headingFont', val)}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Description</label>
                            <RichTextEditor value={content.description} onChange={val => updateField('description', val)}
                                placeholder="A note about our alumni network, their achievements, and how they stay connected..." minHeight="120px"
                                maxWidth="818px" fontSize="18px" fontFamily="'Playfair Display', Georgia, serif" />
                        </div>
                    </div>

                    {/* Alumni list */}
                    {content.alumni.map((al, idx) => (
                        <AlumnusCard key={al.id} alumnus={al} index={idx} length={content.alumni.length}
                            onMove={(i, dir) => updateField('alumni', moveItem(content.alumni, i, dir))}
                            onUpdate={(field, val) => {
                                const updated = [...content.alumni];
                                updated[idx] = { ...updated[idx], [field]: val };
                                updateField('alumni', updated);
                            }}
                            onRemove={() => updateField('alumni', content.alumni.filter((_, i) => i !== idx))}
                            onUploadPhoto={async (file) => {
                                setUploading(prev => ({ ...prev, [`alumnus-${al.id}`]: true }));
                                try {
                                    const res = await uploadContentImageApi(file);
                                    const updated = [...content.alumni];
                                    updated[idx] = { ...updated[idx], photo: res.data.url };
                                    updateField('alumni', updated);
                                } catch (e) { toast.error('Failed to upload'); }
                                finally { setUploading(prev => ({ ...prev, [`alumnus-${al.id}`]: false })); }
                            }}
                            uploading={uploading[`alumnus-${al.id}`]}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};

// ── Alumnus Card ──
const AlumnusCard = ({ alumnus, index, length, onMove, onUpdate, onRemove, onUploadPhoto, uploading }) => {
    const { tc } = useSchoolStore();
    const [cropSrc, setCropSrc] = useState(null);
    const inputStyle = { width: '100%', padding: '10px 13px', border: '1px solid #e5e9f0', borderRadius: '10px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border 0.2s, box-shadow 0.2s, background 0.2s' };
    const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

    return (
        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: tc.primary }}>Alumnus #{index + 1}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ReorderButtons index={index} length={length} onMove={onMove} vertical={false} />
                    <button onClick={onRemove} style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px' }}>×</button>
                </div>
            </div>

            <div className="alumni-photo-grid" style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1.5rem' }}>
                {/* Photo upload */}
                <div>
                    <label style={labelStyle}>Photo</label>
                    <div onClick={() => document.getElementById(`alumnus-photo-${alumnus.id}`).click()}
                        style={{ height: '140px', borderRadius: '12px', border: '1.5px dashed #e2e8f0', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {uploading ? (
                            <div style={{ width: '20px', height: '20px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        ) : alumnus.photo ? (
                            <img src={alumnus.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>👤 Upload</span>
                        )}
                    </div>
                    <input id={`alumnus-photo-${alumnus.id}`} type="file" accept="image/*"
                        onChange={e => {
                            const f = e.target.files[0];
                            e.target.value = '';
                            if (f) setCropSrc(URL.createObjectURL(f));
                        }} style={{ display: 'none' }} />
                    <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', textAlign: 'center' }}>Portrait photo works best · JPG, PNG, WEBP · Max 5MB</p>
                </div>

                {/* Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={labelStyle}>Name</label>
                            <input className="alumni-input" type="text" value={alumnus.name} onChange={e => onUpdate('name', e.target.value)} placeholder="Enter Full Name" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Batch Year (optional)</label>
                            <input className="alumni-input" type="text" value={alumnus.batchYear} onChange={e => onUpdate('batchYear', e.target.value)} placeholder="Enter Batch Year" style={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Achievement Headline</label>
                        <input className="alumni-input" type="text" value={alumnus.achievementHeadline} onChange={e => onUpdate('achievementHeadline', e.target.value)}
                            placeholder="Enter Achievement Headline" style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Testimonial</label>
                        <RichTextEditor value={alumnus.testimonial} onChange={val => onUpdate('testimonial', val)}
                            placeholder="Enter Testimonial" minHeight="90px" fontSize="13px" />
                    </div>
                    <div>
                        <label style={labelStyle}>LinkedIn URL (optional)</label>
                        <input className="alumni-input" type="text" value={alumnus.linkedinUrl} onChange={e => onUpdate('linkedinUrl', e.target.value)} placeholder="Enter LinkedIn URL" style={inputStyle} />
                    </div>
                </div>
            </div>

            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    aspect={null}
                    onCancel={() => setCropSrc(null)}
                    onCropComplete={(croppedFile) => { setCropSrc(null); onUploadPhoto(croppedFile); }}
                />
            )}
        </div>
    );
};

export default Alumni;