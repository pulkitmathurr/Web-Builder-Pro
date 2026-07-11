import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadContentImageApi } from '../../../api/content.api';
import RichTextEditor from '../../../components/common/RichTextEditor';
import ImageCropModal from '../../../components/common/ImageCropModal';
import useSchoolStore from '../../../store/schoolStore';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const CROP_ASPECTS = { banner: 16 / 9, member: 1 };

const defaultContent = { members: [], banners: [] };

const Faculty = () => {
    const { tc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [uploading, setUploading] = useState({});
    const [cropTarget, setCropTarget] = useState(null); // { mode: 'banner' | 'member', id?, src }

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('faculty');
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
        const res = await getModuleContentApi('faculty');
        return !!res?.data?.is_published;
    };

    const handleSave = async (publish = false) => {
        publish ? setPublishing(true) : setSaving(true);
        try {
            await saveModuleContentApi('faculty', content, publish ? 1 : isPublished ? 1 : 0);
            if (publish) {
                let current = await fetchPublishedFlag();
                if (!current) {
                    await togglePublishApi('faculty', 1);
                    current = await fetchPublishedFlag();
                }
                setIsPublished(current);
                toast.success('Faculty published! 🎉');
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
                await togglePublishApi('faculty', 0);
                current = await fetchPublishedFlag();
            }
            setIsPublished(current);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed'); }
    };

    const addMember = () => {
    setContent(prev => ({
        ...prev,
        members: [...prev.members, { id: `m-${Date.now()}`, photo: '', name: '', designation: '', qualification: '', experience: '', bio: '', level: 'general' }]
    }));
};

    const updateMember = (id, field, value) => {
        setContent(prev => ({
            ...prev,
            members: prev.members.map(m => m.id === id ? { ...m, [field]: value } : m)
        }));
    };

    const removeMember = (id) => {
        setContent(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }));
    };

    const onCropConfirmed = async (croppedFile) => {
        const target = cropTarget;
        setCropTarget(null);
        const key = target.mode === 'member' ? target.id : 'banner';
        setUploading(prev => ({ ...prev, [key]: true }));
        try {
            const res = await uploadContentImageApi(croppedFile);
            if (target.mode === 'banner') {
                setContent(prev => ({ ...prev, banners: [...(prev.banners || []), res.data.url] }));
                toast.success('Banner added!');
            } else {
                updateMember(target.id, 'photo', res.data.url);
                toast.success('Photo uploaded!');
            }
        } catch (e) {
            toast.error('Failed to upload');
        } finally {
            setUploading(prev => ({ ...prev, [key]: false }));
        }
    };

    const inputStyle = {
        width: '100%', padding: '10px 13px', border: '0.5px solid #e2e8f0',
        borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none',
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
                .fac-section { animation: fadeInUp 0.35s ease forwards; }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* Hero Header */}
                <div style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '10px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: '-140px', right: '4%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Pages / Faculty</p>
                            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Faculty Members</h1>
                            <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px' }}>
                                Showcase your teachers — photo, qualification, experience and bio.
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '6px', flexShrink: 0 }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8' }}></div>
                            <span style={{ fontSize: '12px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{isPublished ? 'Published' : 'Draft'}</span>
                        </div>
                    </div>
                </div>
{/* Banner Carousel */}
<div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Page Banners</p>
    <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '1rem' }}>Add multiple images — they'll rotate automatically on the public page</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '1.25rem' }}>
        {(content.banners || []).map((img, i) => (
            <div key={i} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '16/9' }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => setContent(prev => ({ ...prev, banners: prev.banners.filter((_, idx) => idx !== i) }))}
                    style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
        ))}
    </div>
    <div onClick={() => document.getElementById('banner-input').click()}
        style={{ border: '1.5px dashed #e2e8f0', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
        {uploading.banner ? <p style={{ fontSize: '13px', color: '#64748b' }}>Uploading...</p> : <p style={{ fontSize: '13px', color: '#64748b' }}>+ Click to add banner image</p>}
    </div>
    <input id="banner-input" type="file" accept="image/*"
        onChange={e => {
            const f = e.target.files[0];
            e.target.value = '';
            if (f) setCropTarget({ mode: 'banner', src: URL.createObjectURL(f) });
        }}
        style={{ display: 'none' }} />
</div>
                {/* Members */}
                <div className="fac-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {content.members.map((m) => (
                        <div key={m.id} style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '20px' }}>
                                {/* Photo */}
                                <div onClick={() => document.getElementById(`photo-${m.id}`).click()}
                                    style={{ width: '110px', height: '110px', borderRadius: '12px', border: '1.5px dashed #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: m.photo ? 'transparent' : '#fafafa' }}>
                                    {uploading[m.id] ? (
                                        <div style={{ width: '22px', height: '22px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    ) : m.photo ? (
                                        <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>📷 Photo</span>
                                    )}
                                </div>
                                <input id={`photo-${m.id}`} type="file" accept="image/*"
                                    onChange={e => {
                                        const f = e.target.files[0];
                                        e.target.value = '';
                                        if (f) setCropTarget({ mode: 'member', id: m.id, src: URL.createObjectURL(f) });
                                    }}
                                    style={{ display: 'none' }} />

                                {/* Fields */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
    <div>
        <label style={labelStyle}>Name</label>
        <input type="text" value={m.name} onChange={e => updateMember(m.id, 'name', e.target.value)} placeholder="e.g. Mrs. Anita Sharma" style={inputStyle} />
    </div>
    <div>
        <label style={labelStyle}>Designation / Subject</label>
        <input type="text" value={m.designation} onChange={e => updateMember(m.id, 'designation', e.target.value)} placeholder="e.g. Mathematics Teacher" style={inputStyle} />
    </div>
</div>
<div>
    <label style={labelStyle}>Teaches At</label>
    <select value={m.level || 'general'} onChange={e => updateMember(m.id, 'level', e.target.value)} style={inputStyle}>
        <option value="general">General (All Levels)</option>
        <option value="primary">Primary School</option>
        <option value="middle">Middle School</option>
        <option value="high">High School</option>
        <option value="senior">Senior School</option>
    </select>
</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 48px', gap: '10px' }}>
                                        <div>
                                            <label style={labelStyle}>Qualification</label>
                                            <input type="text" value={m.qualification} onChange={e => updateMember(m.id, 'qualification', e.target.value)} placeholder="e.g. M.Sc, B.Ed" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Experience</label>
                                            <input type="text" value={m.experience} onChange={e => updateMember(m.id, 'experience', e.target.value)} placeholder="e.g. 12 years" style={inputStyle} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            <button onClick={() => removeMember(m.id)} style={{ width: '100%', height: '38px', background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>×</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '12px' }}>
                                <label style={labelStyle}>Bio (optional)</label>
                                <RichTextEditor value={m.bio} onChange={val => updateMember(m.id, 'bio', val)}
                                    placeholder="Short bio about this teacher..." minHeight="80px" />
                            </div>
                        </div>
                    ))}

                    <button onClick={addMember}
                        style={{ padding: '14px', background: 'transparent', border: '1.5px dashed #e2e8f0', borderRadius: '12px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
                        + Add Faculty Member
                    </button>
                </div>

                {/* Bottom Save Bar */}
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={() => handleSave(false)} disabled={saving}
                        style={{ padding: '11px 24px', background: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
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

            {cropTarget && (
                <ImageCropModal
                    imageSrc={cropTarget.src}
                    aspect={CROP_ASPECTS[cropTarget.mode]}
                    onCancel={() => setCropTarget(null)}
                    onCropComplete={onCropConfirmed}
                />
            )}
        </>
    );
};

export default Faculty;