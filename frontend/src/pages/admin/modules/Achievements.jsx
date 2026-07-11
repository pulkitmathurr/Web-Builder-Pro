import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadContentImageApi } from '../../../api/content.api';
import RichTextEditor from '../../../components/common/RichTextEditor';
import ImageCropModal from '../../../components/common/ImageCropModal';
import ItalicToggle from '../../../components/common/ItalicToggle';
import useSchoolStore from '../../../store/schoolStore';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const defaultContent = {
    banner: '',
    heading: '',
    description: '',
    achievements: [],
    certifications: [],
};

const CATEGORIES = ['Academic', 'Sports', 'Cultural', 'Co-Curricular', 'Other'];

const Achievements = () => {
    const { tc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [uploading, setUploading] = useState({});
    const [cropTarget, setCropTarget] = useState(null); // { mode: 'banner' | 'achievement' | 'cert', id, src }

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('achievements');
            if (res.data) {
                setContent({ ...defaultContent, ...res.data.content });
                setIsPublished(res.data.is_published === 1);
            }
        } catch (e) {
            console.log('No content yet');
        } finally {
            setLoading(false);
        }
    };

    const fetchPublishedFlag = async () => {
        const res = await getModuleContentApi('achievements');
        return !!res?.data?.is_published;
    };

    const handleSave = async (publish = false) => {
        publish ? setPublishing(true) : setSaving(true);
        try {
            await saveModuleContentApi('achievements', content, publish ? 1 : isPublished ? 1 : 0);
            if (publish) {
                let current = await fetchPublishedFlag();
                if (!current) {
                    await togglePublishApi('achievements', 1);
                    current = await fetchPublishedFlag();
                }
                setIsPublished(current);
                toast.success('Achievements published!');
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
                await togglePublishApi('achievements', 0);
                current = await fetchPublishedFlag();
            }
            setIsPublished(current);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed'); }
    };

    const updateField = (field, value) => setContent(prev => ({ ...prev, [field]: value }));

    // ── Banner crop flow ──
    const onBannerFileSelected = (file) => {
        setCropTarget({ mode: 'banner', src: URL.createObjectURL(file) });
    };

    // ── Achievement entries ──
    const addAchievement = () => {
        const newItem = { id: `ach-${Date.now()}`, title: '', name: '', designation: '', quote: '', year: '', category: 'Academic', photo: '' };
        updateField('achievements', [...content.achievements, newItem]);
    };

    const updateAchievement = (id, field, value) => {
        updateField('achievements', content.achievements.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const removeAchievement = (id) => {
        updateField('achievements', content.achievements.filter(a => a.id !== id));
    };

    const onAchievementPhotoSelected = (id, file) => {
        setCropTarget({ mode: 'achievement', id, src: URL.createObjectURL(file) });
    };

    // ── Certifications ──
    const addCertification = () => {
        updateField('certifications', [...content.certifications, { id: `cert-${Date.now()}`, image: '', title: '', info: '' }]);
    };

    const updateCertification = (id, field, value) => {
        updateField('certifications', content.certifications.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const removeCertification = (id) => {
        updateField('certifications', content.certifications.filter(c => c.id !== id));
    };

    const onCertImageSelected = async (id, file) => {
        // Certificates use direct upload (no crop) since they're documents, not photos
        setUploading(prev => ({ ...prev, [`cert-${id}`]: true }));
        try {
            const res = await uploadContentImageApi(file);
            updateCertification(id, 'image', res.data.url);
            toast.success('Certificate uploaded');
        } catch (e) { toast.error('Failed to upload'); }
        finally { setUploading(prev => ({ ...prev, [`cert-${id}`]: false })); }
    };

    // ── Crop confirm handler — routes to the right place based on mode ──
    const onCropConfirmed = async (croppedFile) => {
        const target = cropTarget;
        setCropTarget(null);
        const key = target.mode === 'banner' ? 'banner' : target.id;
        setUploading(prev => ({ ...prev, [key]: true }));
        try {
            const res = await uploadContentImageApi(croppedFile);
            if (target.mode === 'banner') {
                updateField('banner', res.data.url);
                toast.success('Banner uploaded');
            } else if (target.mode === 'achievement') {
                updateAchievement(target.id, 'photo', res.data.url);
                toast.success('Photo uploaded');
            }
        } catch (e) {
            toast.error('Failed to upload');
        } finally {
            setUploading(prev => ({ ...prev, [key]: false }));
        }
    };

    const inputStyle = {
        width: '100%', padding: '10px 13px', border: '1px solid #e5e7eb',
        borderRadius: '10px', fontSize: '13px', color: '#0f172a', outline: 'none',
        boxSizing: 'border-box', background: '#ffffff', fontFamily: 'system-ui, sans-serif',
    };

    const labelStyle = {
        display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
    };

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
                .ach-section { animation: fadeInUp 0.35s ease forwards; }
                input[type=text]:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* Hero Header */}
                <div style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '10px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: '-140px', right: '4%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Pages / Achievements</p>
                            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Achievements</h1>
                            <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px' }}>
                                Showcase school and student achievements, with certificates.
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '6px', flexShrink: 0 }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8' }}></div>
                            <span style={{ fontSize: '12px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{isPublished ? 'Published' : 'Draft'}</span>
                        </div>
                    </div>
                </div>

                {/* Banner + Heading + Description */}
                <div className="ach-section" style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px', padding: '1.75rem', marginBottom: '1.25rem', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>Banner Image</label>
                        <div onClick={() => document.getElementById('banner-input').click()}
                            style={{ border: '1.5px dashed #e5e7eb', borderRadius: '14px', padding: content.banner ? 0 : '2rem', textAlign: 'center', cursor: 'pointer', background: content.banner ? 'transparent' : '#fafafa', overflow: 'hidden', minHeight: content.banner ? '180px' : 'auto' }}>
                            {uploading.banner ? (
                                <div style={{ padding: '2rem' }}><div style={{ width: '24px', height: '24px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div></div>
                            ) : content.banner ? (
                                <img src={content.banner} alt="" style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                            ) : (
                                <p style={{ fontSize: '13px', color: '#64748b' }}>Click to upload banner — crop tool will open</p>
                            )}
                        </div>
                        <input id="banner-input" type="file" accept="image/*"
                            onChange={e => { const f = e.target.files[0]; if (f) onBannerFileSelected(f); e.target.value = ''; }}
                            style={{ display: 'none' }} />
                    </div>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>Heading</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="text" value={content.heading} onChange={e => updateField('heading', e.target.value)} placeholder="e.g. Our Achievements" style={{ ...inputStyle, fontStyle: content.headingItalic ? 'italic' : 'normal' }} />
                            <ItalicToggle active={!!content.headingItalic} onToggle={() => updateField('headingItalic', !content.headingItalic)} />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Description</label>
                        <RichTextEditor value={content.description} onChange={val => updateField('description', val)} placeholder="A brief overview of the school's achievements..." minHeight="120px" />
                    </div>
                </div>

                {/* Achievement Entries */}
                <div className="ach-section" style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Achievement Entries <span style={{ color: '#94a3b8', fontWeight: 400 }}>({content.achievements.length})</span></p>
                        <button onClick={addAchievement} style={{ padding: '8px 16px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            + Add Achievement
                        </button>
                    </div>

                    {content.achievements.length === 0 && (
                        <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px', padding: '2.5rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>
                            <p style={{ fontSize: '13px', color: '#94a3b8' }}>No achievements added yet</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {content.achievements.map((a, idx) => {
                            const photoKey = a.id;
                            return (
                                <div key={a.id} style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                        <p style={{ fontSize: '13px', fontWeight: 600, color: tc.primary }}>Achievement #{idx + 1}</p>
                                        <button onClick={() => removeAchievement(a.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px' }}>×</button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px' }}>
                                        {/* Photo */}
                                        <div>
                                            <label style={labelStyle}>Photo</label>
                                            <div onClick={() => document.getElementById(`ach-photo-${a.id}`).click()}
                                                style={{ width: '100%', height: '220px', borderRadius: '14px', border: '1.5px dashed #e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: a.photo ? 'transparent' : '#fafafa' }}>
                                                {uploading[photoKey] ? (
                                                    <div style={{ width: '22px', height: '22px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                                ) : a.photo ? (
                                                    <img src={a.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Click to upload</span>
                                                )}
                                            </div>
                                            <input id={`ach-photo-${a.id}`} type="file" accept="image/*"
                                                onChange={e => { const f = e.target.files[0]; if (f) onAchievementPhotoSelected(a.id, f); e.target.value = ''; }}
                                                style={{ display: 'none' }} />
                                        </div>

                                        {/* Fields */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                                <div>
                                                    <label style={labelStyle}>Person Name</label>
                                                    <input type="text" value={a.name} onChange={e => updateAchievement(a.id, 'name', e.target.value)} placeholder="e.g. Aarav Sharma" style={inputStyle} />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Designation / Class</label>
                                                    <input type="text" value={a.designation} onChange={e => updateAchievement(a.id, 'designation', e.target.value)} placeholder="e.g. Class 10-A" style={inputStyle} />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Year</label>
                                                    <input type="text" value={a.year} onChange={e => updateAchievement(a.id, 'year', e.target.value)} placeholder="e.g. 2024" style={inputStyle} />
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '10px' }}>
                                                <div>
                                                    <label style={labelStyle}>Achievement Title</label>
                                                    <input type="text" value={a.title} onChange={e => updateAchievement(a.id, 'title', e.target.value)} placeholder="e.g. National Science Olympiad Winner" style={inputStyle} />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Category</label>
                                                    <select value={a.category} onChange={e => updateAchievement(a.id, 'category', e.target.value)} style={inputStyle}>
                                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label style={labelStyle}>Description / Quote</label>
                                                <RichTextEditor value={a.quote} onChange={val => updateAchievement(a.id, 'quote', val)} placeholder="Write about the achievement in detail..." minHeight="110px" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Certifications */}
                <div className="ach-section" style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px', padding: '1.75rem', marginBottom: '1.25rem', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Certifications</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '1.25rem' }}>Upload certificate images with basic info — shown in a grid</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '1rem' }}>
                        {content.certifications.map((c) => (
                            <div key={c.id} style={{ border: '1px solid #f1f5f9', borderRadius: '14px', overflow: 'hidden' }}>
                                <div onClick={() => document.getElementById(`cert-img-${c.id}`).click()}
                                    style={{ height: '130px', background: '#fafbfc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {uploading[`cert-${c.id}`] ? (
                                        <div style={{ width: '20px', height: '20px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    ) : c.image ? (
                                        <img src={c.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Upload</span>
                                    )}
                                </div>
                                <input id={`cert-img-${c.id}`} type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) onCertImageSelected(c.id, f); e.target.value = ''; }} style={{ display: 'none' }} />
                                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <input type="text" value={c.title} onChange={e => updateCertification(c.id, 'title', e.target.value)} placeholder="Title" style={{ ...inputStyle, fontSize: '12px', padding: '8px 10px' }} />
                                    <input type="text" value={c.info} onChange={e => updateCertification(c.id, 'info', e.target.value)} placeholder="Basic info" style={{ ...inputStyle, fontSize: '12px', padding: '8px 10px' }} />
                                    <button onClick={() => removeCertification(c.id)} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={addCertification} style={{ width: '100%', padding: '11px', background: 'transparent', border: '1.5px dashed #e5e7eb', borderRadius: '12px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
                        + Add Certification
                    </button>
                </div>

                {/* Bottom Save Bar */}
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={() => handleSave(false)} disabled={saving}
                        style={{ padding: '11px 24px', background: '#ffffff', color: '#64748b', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                        {saving ? 'Saving...' : 'Save Draft'}
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

            {/* Crop Modal */}
            {cropTarget && (
                <ImageCropModal
                    imageSrc={cropTarget.src}
                    aspect={cropTarget.mode === 'banner' ? 16 / 9 : 1}
                    onCancel={() => setCropTarget(null)}
                    onCropComplete={onCropConfirmed}
                />
            )}
        </>
    );
};

export default Achievements;