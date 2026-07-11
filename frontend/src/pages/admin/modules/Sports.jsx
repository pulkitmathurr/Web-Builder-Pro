import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadContentImageApi, uploadPdfApi } from '../../../api/content.api';
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

const PAGES = [
    { key: 'sportsAt', label: 'Sports at School' },
    { key: 'sportsOffered', label: 'Sports Offered' },
    { key: 'sportingEvents', label: 'Sporting Events' },
    { key: 'awards', label: 'Sports Awards & Achievements' },
];

const defaultPageData = { banner: '', heading: '', description: '', images: [] };

const defaultContent = {
    sportsAt: { ...defaultPageData },
    sportsOffered: { banner: '', heading: '', description: '', offeredSports: [] },
    sportingEvents: { banner: '', heading: '', description: '', events: [] },
    awards: { banner: '', heading: '', description: '', images: [], certifications: [], proud: [], yearlyAwards: [] },
};

const Sports = () => {
    const { tc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [activePage, setActivePage] = useState('sportsAt');
    const [uploading, setUploading] = useState({});
    const [bannerCropSrc, setBannerCropSrc] = useState(null);

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('sports');
            if (res.data) {
                const merged = { ...defaultContent };
                Object.keys(res.data.content || {}).forEach(k => {
                    if (k === 'sportingEvents') merged[k] = { ...defaultContent.sportingEvents, ...res.data.content[k] };
                    else if (k === 'sportsOffered') merged[k] = { ...defaultContent.sportsOffered, ...res.data.content[k] };
                    else if (k === 'awards') merged[k] = { ...defaultContent.awards, ...res.data.content[k] };
                    else merged[k] = { ...defaultPageData, ...res.data.content[k] };
                });
                setContent(merged);
                setIsPublished(res.data.is_published === 1);
            }
        } catch (e) {
            console.log('No content yet');
        } finally {
            setLoading(false);
        }
    };

    const fetchPublishedFlag = async () => {
        const res = await getModuleContentApi('sports');
        return !!res?.data?.is_published;
    };

    const handleSave = async (publish = false) => {
        publish ? setPublishing(true) : setSaving(true);
        try {
            await saveModuleContentApi('sports', content, publish ? 1 : isPublished ? 1 : 0);
            if (publish) {
                let current = await fetchPublishedFlag();
                if (!current) {
                    await togglePublishApi('sports', 1);
                    current = await fetchPublishedFlag();
                }
                setIsPublished(current);
                toast.success('Sports page published! 🎉');
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
                await togglePublishApi('sports', 0);
                current = await fetchPublishedFlag();
            }
            setIsPublished(current);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed'); }
    };

    const updateField = (field, value) => {
        setContent(prev => ({ ...prev, [activePage]: { ...prev[activePage], [field]: value } }));
    };

    const uploadBanner = async (file) => {
        setUploading(prev => ({ ...prev, banner: true }));
        try {
            const res = await uploadContentImageApi(file);
            updateField('banner', res.data.url);
            toast.success('Banner uploaded!');
        } catch (e) { toast.error('Failed to upload'); }
        finally { setUploading(prev => ({ ...prev, banner: false })); }
    };

    const addImages = async (files, field = 'images') => {
        setUploading(prev => ({ ...prev, [field]: true }));
        try {
            const urls = [];
            for (const file of files) {
                const res = await uploadContentImageApi(file);
                urls.push(res.data.url);
            }
            const current = content[activePage][field] || [];
            updateField(field, [...current, ...urls]);
            toast.success(`${urls.length} image(s) added!`);
        } catch (e) { toast.error('Failed to upload'); }
        finally { setUploading(prev => ({ ...prev, [field]: false })); }
    };

    const removeImage = (idx, field = 'images') => {
        const current = content[activePage][field] || [];
        updateField(field, current.filter((_, i) => i !== idx));
    };

    const inputStyle = {
        width: '100%', padding: '11px 14px', border: '0.5px solid #e2e8f0',
        borderRadius: '10px', fontSize: '13.5px', color: '#0f172a', outline: 'none',
        boxSizing: 'border-box', background: '#ffffff', fontFamily: 'system-ui, sans-serif',
    };

    const labelStyle = {
        display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
    };

    const ImageUploadBox = ({ label, value, field, hint }) => (
        <div>
            <label style={labelStyle}>{label}</label>
            <div onClick={() => document.getElementById(`upload-${field}`).click()}
                style={{ border: '1.5px dashed #e2e8f0', borderRadius: '12px', padding: value ? 0 : '2rem', textAlign: 'center', cursor: 'pointer', background: value ? 'transparent' : '#fafafa', overflow: 'hidden', minHeight: value ? '160px' : 'auto' }}>
                {uploading[field] ? (
                    <div style={{ padding: '2rem' }}><div style={{ width: '24px', height: '24px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div></div>
                ) : value ? (
                    <img src={value} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                ) : (
                    <p style={{ fontSize: '13px', color: '#64748b' }}>🖼️ {hint || 'Click to upload'}</p>
                )}
            </div>
            <input id={`upload-${field}`} type="file" accept="image/*"
                onChange={e => {
                    const f = e.target.files[0];
                    e.target.value = '';
                    if (f) setBannerCropSrc(URL.createObjectURL(f));
                }}
                style={{ display: 'none' }} />
        </div>
    );

    const ImageGrid = ({ field = 'images', label = 'Images' }) => (
        <div>
            <label style={labelStyle}>{label}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '1.25rem' }}>
                {(content[activePage][field] || []).map((img, i) => (
                    <div key={i} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '1' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => removeImage(i, field)}
                            style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                ))}
            </div>
            <div onClick={() => document.getElementById(`grid-${field}`).click()}
                style={{ border: '1.5px dashed #e2e8f0', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
                {uploading[field] ? <p style={{ fontSize: '13px', color: '#64748b' }}>Uploading...</p> : <p style={{ fontSize: '13px', color: '#64748b' }}>+ Click to add images (multiple allowed)</p>}
            </div>
            <input id={`grid-${field}`} type="file" accept="image/*" multiple
                onChange={e => { const files = Array.from(e.target.files); if (files.length > 0) addImages(files, field); }}
                style={{ display: 'none' }} />
        </div>
    );

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    const pageData = content[activePage];

    return (
        <>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .sports-section { animation: fadeInUp 0.35s ease forwards; }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* Hero Header */}
                <div style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '10px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: '-140px', right: '4%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Pages / Sports</p>
                            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Sports</h1>
                            <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px' }}>
                                Manage sports info, events, awards and yearly achievements.
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '6px', flexShrink: 0 }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8' }}></div>
                            <span style={{ fontSize: '12px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{isPublished ? 'Published' : 'Draft'}</span>
                        </div>
                    </div>
                </div>

                {/* Page Tabs */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {PAGES.map(p => (
                        <button key={p.key} onClick={() => setActivePage(p.key)}
                            style={{ padding: '10px 18px', borderRadius: '10px', border: activePage === p.key ? `1.5px solid ${tc.primary}` : '0.5px solid #e2e8f0', fontSize: '13px', cursor: 'pointer', background: activePage === p.key ? tc.light : '#ffffff', color: activePage === p.key ? tc.primary : '#64748b', fontWeight: activePage === p.key ? 600 : 400 }}>
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* ── Sports at School (simple page) ── */}
                {activePage === 'sportsAt' && (
                    <div className="sports-section" style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <ImageUploadBox label="Banner Image" value={pageData.banner} field="banner" hint="Recommended: 1920×1080" />
                        <div>
                            <label style={labelStyle}>Heading</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="text" value={pageData.heading} onChange={e => updateField('heading', e.target.value)}
                                    placeholder="e.g. Sports at Our School" style={{ ...inputStyle, fontStyle: pageData.headingItalic ? 'italic' : 'normal' }} />
                                <ItalicToggle active={!!pageData.headingItalic} onToggle={() => updateField('headingItalic', !pageData.headingItalic)} />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Description</label>
                            <RichTextEditor value={pageData.description} onChange={val => updateField('description', val)}
                                placeholder="Describe this..." minHeight="150px" />
                        </div>
                        <ImageGrid field="images" label="Gallery Images — collage completes at 7, then every +4 (7, 11, 15...)" />
                    </div>
                )}

                {/* ── Sports Offered — same list pattern as Sporting Events ── */}
                {activePage === 'sportsOffered' && (
                    <div className="sports-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <ImageUploadBox label="Banner Image" value={pageData.banner} field="banner" hint="Recommended: 1920×1080" />
                            <div>
                                <label style={labelStyle}>Heading</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input type="text" value={pageData.heading} onChange={e => updateField('heading', e.target.value)}
                                        placeholder="e.g. Sports Offered" style={{ ...inputStyle, fontStyle: pageData.headingItalic ? 'italic' : 'normal' }} />
                                    <ItalicToggle active={!!pageData.headingItalic} onToggle={() => updateField('headingItalic', !pageData.headingItalic)} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Description</label>
                                <RichTextEditor value={pageData.description} onChange={val => updateField('description', val)}
                                    placeholder="Overview of the sports offered at our school..." minHeight="120px" />
                            </div>
                        </div>

                        {/* Offered sports list */}
                        {(pageData.offeredSports || []).map((sp, idx) => (
                            <SportItemCard key={sp.id} sport={sp} index={idx}
                                onUpdate={(field, val) => {
                                    const updated = [...pageData.offeredSports];
                                    updated[idx] = { ...updated[idx], [field]: val };
                                    updateField('offeredSports', updated);
                                }}
                                onRemove={() => updateField('offeredSports', pageData.offeredSports.filter((_, i) => i !== idx))}
                                onAddImages={async (files) => {
                                    setUploading(prev => ({ ...prev, [`sport-${sp.id}`]: true }));
                                    try {
                                        const urls = [];
                                        for (const file of files) {
                                            const res = await uploadContentImageApi(file);
                                            urls.push(res.data.url);
                                        }
                                        const updated = [...pageData.offeredSports];
                                        updated[idx] = { ...updated[idx], images: [...(updated[idx].images || []), ...urls] };
                                        updateField('offeredSports', updated);
                                        toast.success(`${urls.length} image(s) added!`);
                                    } catch (e) { toast.error('Failed to upload'); }
                                    finally { setUploading(prev => ({ ...prev, [`sport-${sp.id}`]: false })); }
                                }}
                                onRemoveImage={(imgIdx) => {
                                    const updated = [...pageData.offeredSports];
                                    updated[idx] = { ...updated[idx], images: updated[idx].images.filter((_, i) => i !== imgIdx) };
                                    updateField('offeredSports', updated);
                                }}
                                uploading={uploading[`sport-${sp.id}`]}
                            />
                        ))}

                        <button onClick={() => updateField('offeredSports', [...(pageData.offeredSports || []), { id: `sport-${Date.now()}`, heading: '', description: '', images: [] }])}
                            style={{ padding: '14px', background: 'transparent', border: '1.5px dashed #e2e8f0', borderRadius: '12px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
                            + Add Sport
                        </button>
                    </div>
                )}

                {/* ── Sporting Events ── */}
                {activePage === 'sportingEvents' && (
                    <div className="sports-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <ImageUploadBox label="Banner Image" value={pageData.banner} field="banner" hint="Recommended: 1920×1080" />
                            <div>
                                <label style={labelStyle}>Heading</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input type="text" value={pageData.heading} onChange={e => updateField('heading', e.target.value)}
                                        placeholder="e.g. Sporting Events" style={{ ...inputStyle, fontStyle: pageData.headingItalic ? 'italic' : 'normal' }} />
                                    <ItalicToggle active={!!pageData.headingItalic} onToggle={() => updateField('headingItalic', !pageData.headingItalic)} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Description</label>
                                <RichTextEditor value={pageData.description} onChange={val => updateField('description', val)}
                                    placeholder="Overview of events organized throughout the year..." minHeight="120px" />
                            </div>
                        </div>

                        {/* Events list */}
                        {(pageData.events || []).map((ev, idx) => (
                            <EventCard key={ev.id} event={ev} index={idx}
                                onUpdate={(field, val) => {
                                    const updated = [...pageData.events];
                                    updated[idx] = { ...updated[idx], [field]: val };
                                    updateField('events', updated);
                                }}
                                onRemove={() => updateField('events', pageData.events.filter((_, i) => i !== idx))}
                                onAddImages={async (files) => {
                                    setUploading(prev => ({ ...prev, [`event-${ev.id}`]: true }));
                                    try {
                                        const urls = [];
                                        for (const file of files) {
                                            const res = await uploadContentImageApi(file);
                                            urls.push(res.data.url);
                                        }
                                        const updated = [...pageData.events];
                                        updated[idx] = { ...updated[idx], images: [...(updated[idx].images || []), ...urls] };
                                        updateField('events', updated);
                                        toast.success(`${urls.length} image(s) added!`);
                                    } catch (e) { toast.error('Failed to upload'); }
                                    finally { setUploading(prev => ({ ...prev, [`event-${ev.id}`]: false })); }
                                }}
                                onRemoveImage={(imgIdx) => {
                                    const updated = [...pageData.events];
                                    updated[idx] = { ...updated[idx], images: updated[idx].images.filter((_, i) => i !== imgIdx) };
                                    updateField('events', updated);
                                }}
                                uploading={uploading[`event-${ev.id}`]}
                            />
                        ))}

                        <button onClick={() => updateField('events', [...(pageData.events || []), { id: `ev-${Date.now()}`, heading: '', description: '', images: [] }])}
                            style={{ padding: '14px', background: 'transparent', border: '1.5px dashed #e2e8f0', borderRadius: '12px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
                            + Add Sporting Event
                        </button>
                    </div>
                )}

                {/* ── Awards & Achievements ── */}
                {activePage === 'awards' && (
                    <div className="sports-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <ImageUploadBox label="Banner Image" value={pageData.banner} field="banner" hint="Recommended: 1920×1080" />
                            <div>
                                <label style={labelStyle}>Heading</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input type="text" value={pageData.heading} onChange={e => updateField('heading', e.target.value)}
                                        placeholder="e.g. Sports Awards & Achievements" style={{ ...inputStyle, fontStyle: pageData.headingItalic ? 'italic' : 'normal' }} />
                                    <ItalicToggle active={!!pageData.headingItalic} onToggle={() => updateField('headingItalic', !pageData.headingItalic)} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Description</label>
                                <RichTextEditor value={pageData.description} onChange={val => updateField('description', val)}
                                    placeholder="Overview of our sports achievements..." minHeight="120px" />
                            </div>
                            <ImageGrid field="images" label="Photo Carousel Images" />
                        </div>

                        {/* Certifications */}
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Certifications</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '1.25rem' }}>Upload certificate images with basic info — shown in a grid</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '1rem' }}>
                                {(pageData.certifications || []).map((cert, i) => (
                                    <CertCard key={cert.id} cert={cert}
                                        onUpdate={(field, val) => {
                                            const updated = [...pageData.certifications];
                                            updated[i] = { ...updated[i], [field]: val };
                                            updateField('certifications', updated);
                                        }}
                                        onRemove={() => updateField('certifications', pageData.certifications.filter((_, idx) => idx !== i))}
                                        onUpload={async (file) => {
                                            setUploading(prev => ({ ...prev, [`cert-${cert.id}`]: true }));
                                            try {
                                                const res = await uploadContentImageApi(file);
                                                const updated = [...pageData.certifications];
                                                updated[i] = { ...updated[i], image: res.data.url };
                                                updateField('certifications', updated);
                                            } catch (e) { toast.error('Failed'); }
                                            finally { setUploading(prev => ({ ...prev, [`cert-${cert.id}`]: false })); }
                                        }}
                                        uploading={uploading[`cert-${cert.id}`]}
                                    />
                                ))}
                            </div>
                            <button onClick={() => updateField('certifications', [...(pageData.certifications || []), { id: `cert-${Date.now()}`, image: '', title: '', info: '' }])}
                                style={{ width: '100%', padding: '11px', background: 'transparent', border: '1.5px dashed #e2e8f0', borderRadius: '10px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
                                + Add Certification
                            </button>
                        </div>

                        {/* Making Us Proud */}
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Making Us Proud</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '1.25rem' }}>Student photos with achievement details</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '1rem' }}>
                                {(pageData.proud || []).map((stu, i) => (
                                    <ProudCard key={stu.id} student={stu}
                                        onUpdate={(field, val) => {
                                            const updated = [...pageData.proud];
                                            updated[i] = { ...updated[i], [field]: val };
                                            updateField('proud', updated);
                                        }}
                                        onRemove={() => updateField('proud', pageData.proud.filter((_, idx) => idx !== i))}
                                        onUpload={async (file) => {
                                            setUploading(prev => ({ ...prev, [`proud-${stu.id}`]: true }));
                                            try {
                                                const res = await uploadContentImageApi(file);
                                                const updated = [...pageData.proud];
                                                updated[i] = { ...updated[i], photo: res.data.url };
                                                updateField('proud', updated);
                                            } catch (e) { toast.error('Failed'); }
                                            finally { setUploading(prev => ({ ...prev, [`proud-${stu.id}`]: false })); }
                                        }}
                                        uploading={uploading[`proud-${stu.id}`]}
                                    />
                                ))}
                            </div>
                            <button onClick={() => updateField('proud', [...(pageData.proud || []), { id: `proud-${Date.now()}`, photo: '', name: '', achievement: '' }])}
                                style={{ width: '100%', padding: '11px', background: 'transparent', border: '1.5px dashed #e2e8f0', borderRadius: '10px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
                                + Add Student
                            </button>
                        </div>

                        {/* Yearly Award PDFs */}
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Yearly Award PDFs</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '1.25rem' }}>Add a year and upload the award winners PDF — shown in sidebar, opens PDF on click</p>
                            {(pageData.yearlyAwards || []).map((yr, i) => (
                                <YearlyAwardRow key={yr.id} yearItem={yr}
                                    onUpdate={(field, val) => {
                                        const updated = [...pageData.yearlyAwards];
                                        updated[i] = { ...updated[i], [field]: val };
                                        updateField('yearlyAwards', updated);
                                    }}
                                    onRemove={() => updateField('yearlyAwards', pageData.yearlyAwards.filter((_, idx) => idx !== i))}
                                    uploading={uploading[`pdf-${yr.id}`]}
                                    onUploadStart={() => setUploading(prev => ({ ...prev, [`pdf-${yr.id}`]: true }))}
                                    onUploadEnd={() => setUploading(prev => ({ ...prev, [`pdf-${yr.id}`]: false }))}
                                />
                            ))}
                            <button onClick={() => updateField('yearlyAwards', [...(pageData.yearlyAwards || []), { id: `yr-${Date.now()}`, year: '', pdfUrl: '' }])}
                                style={{ width: '100%', padding: '11px', background: 'transparent', border: '1.5px dashed #e2e8f0', borderRadius: '10px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
                                + Add Year
                            </button>
                        </div>
                    </div>
                )}

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

            {bannerCropSrc && (
                <ImageCropModal
                    imageSrc={bannerCropSrc}
                    aspect={16 / 9}
                    onCancel={() => setBannerCropSrc(null)}
                    onCropComplete={(croppedFile) => { setBannerCropSrc(null); uploadBanner(croppedFile); }}
                />
            )}
        </>
    );
};

// ── Event Card Component (used for Sporting Events) ──
const EventCard = ({ event, index, onUpdate, onRemove, onAddImages, onRemoveImage, uploading }) => {
    const { tc } = useSchoolStore();
    const inputStyle = { width: '100%', padding: '10px 13px', border: '0.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff' };
    const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

    return (
        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: tc.primary }}>Event #{index + 1}</p>
                <button onClick={onRemove} style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                    <label style={labelStyle}>Event Heading</label>
                    <input type="text" value={event.heading} onChange={e => onUpdate('heading', e.target.value)} placeholder="e.g. Annual Sports Day 2024" style={inputStyle} />
                </div>
                <div>
                    <label style={labelStyle}>Description</label>
                    <RichTextEditor value={event.description} onChange={val => onUpdate('description', val)} placeholder="Describe this event..." minHeight="80px" />
                </div>
                <div>
                    <label style={labelStyle}>Event Images (carousel)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '10px' }}>
                        {(event.images || []).map((img, i) => (
                            <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1' }}>
                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button onClick={() => onRemoveImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '12px' }}>×</button>
                            </div>
                        ))}
                    </div>
                    <div onClick={() => document.getElementById(`ev-img-${event.id}`).click()}
                        style={{ border: '1.5px dashed #e2e8f0', borderRadius: '10px', padding: '1rem', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
                        {uploading ? <p style={{ fontSize: '12px', color: '#64748b' }}>Uploading...</p> : <p style={{ fontSize: '12px', color: '#64748b' }}>+ Add images</p>}
                    </div>
                    <input id={`ev-img-${event.id}`} type="file" accept="image/*" multiple
                        onChange={e => { const files = Array.from(e.target.files); if (files.length > 0) onAddImages(files); }}
                        style={{ display: 'none' }} />
                </div>
            </div>
        </div>
    );
};

// ── Sport Item Card Component (used for Sports Offered) — identical pattern to EventCard, relabeled ──
const SportItemCard = ({ sport, index, onUpdate, onRemove, onAddImages, onRemoveImage, uploading }) => {
    const { tc } = useSchoolStore();
    const inputStyle = { width: '100%', padding: '10px 13px', border: '0.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff' };
    const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

    return (
        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: tc.primary }}>Sport #{index + 1}</p>
                <button onClick={onRemove} style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                    <label style={labelStyle}>Sport Name</label>
                    <input type="text" value={sport.heading} onChange={e => onUpdate('heading', e.target.value)} placeholder="e.g. Football, Basketball, Swimming" style={inputStyle} />
                </div>
                <div>
                    <label style={labelStyle}>Description</label>
                    <RichTextEditor value={sport.description} onChange={val => onUpdate('description', val)} placeholder="Describe this sport, facilities, coaching, achievements..." minHeight="80px" />
                </div>
                <div>
                    <label style={labelStyle}>Sport Images (carousel)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '10px' }}>
                        {(sport.images || []).map((img, i) => (
                            <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1' }}>
                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button onClick={() => onRemoveImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '12px' }}>×</button>
                            </div>
                        ))}
                    </div>
                    <div onClick={() => document.getElementById(`sport-img-${sport.id}`).click()}
                        style={{ border: '1.5px dashed #e2e8f0', borderRadius: '10px', padding: '1rem', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
                        {uploading ? <p style={{ fontSize: '12px', color: '#64748b' }}>Uploading...</p> : <p style={{ fontSize: '12px', color: '#64748b' }}>+ Add images</p>}
                    </div>
                    <input id={`sport-img-${sport.id}`} type="file" accept="image/*" multiple
                        onChange={e => { const files = Array.from(e.target.files); if (files.length > 0) onAddImages(files); }}
                        style={{ display: 'none' }} />
                </div>
            </div>
        </div>
    );
};

// ── Certification Card ──
const CertCard = ({ cert, onUpdate, onRemove, onUpload, uploading }) => {
    const { tc } = useSchoolStore();
    const inputStyle = { width: '100%', padding: '8px 10px', border: '0.5px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff' };
    return (
        <div style={{ border: '0.5px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
            <div onClick={() => document.getElementById(`cert-img-${cert.id}`).click()}
                style={{ height: '120px', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {uploading ? <div style={{ width: '20px', height: '20px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    : cert.image ? <img src={cert.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '12px', color: '#94a3b8' }}>📜 Upload</span>}
            </div>
            <input id={`cert-img-${cert.id}`} type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) onUpload(f); }} style={{ display: 'none' }} />
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input type="text" value={cert.title} onChange={e => onUpdate('title', e.target.value)} placeholder="Title" style={inputStyle} />
                <input type="text" value={cert.info} onChange={e => onUpdate('info', e.target.value)} placeholder="Basic info" style={inputStyle} />
                <button onClick={onRemove} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
            </div>
        </div>
    );
};

// ── Making Us Proud Card ──
const ProudCard = ({ student, onUpdate, onRemove, onUpload, uploading }) => {
    const { tc } = useSchoolStore();
    const [cropSrc, setCropSrc] = useState(null);
    const inputStyle = { width: '100%', padding: '8px 10px', border: '0.5px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff' };
    return (
        <div style={{ border: '0.5px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
            <div onClick={() => document.getElementById(`proud-img-${student.id}`).click()}
                style={{ height: '120px', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {uploading ? <div style={{ width: '20px', height: '20px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    : student.photo ? <img src={student.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '12px', color: '#94a3b8' }}>👤 Upload</span>}
            </div>
            <input id={`proud-img-${student.id}`} type="file" accept="image/*"
                onChange={e => {
                    const f = e.target.files[0];
                    e.target.value = '';
                    if (f) setCropSrc(URL.createObjectURL(f));
                }}
                style={{ display: 'none' }} />
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input type="text" value={student.name} onChange={e => onUpdate('name', e.target.value)} placeholder="Student Name" style={inputStyle} />
                <input type="text" value={student.achievement} onChange={e => onUpdate('achievement', e.target.value)} placeholder="Achievement" style={inputStyle} />
                <button onClick={onRemove} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
            </div>
            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    aspect={1}
                    onCancel={() => setCropSrc(null)}
                    onCropComplete={(croppedFile) => { setCropSrc(null); onUpload(croppedFile); }}
                />
            )}
        </div>
    );
};

// ── Yearly Award PDF Row ──
const YearlyAwardRow = ({ yearItem, onUpdate, onRemove, uploading, onUploadStart, onUploadEnd }) => {
    const inputStyle = { width: '100%', padding: '9px 12px', border: '0.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff' };

    const handlePdfUpload = async (file) => {
        onUploadStart();
        try {
            const res = await uploadPdfApi(file);
            onUpdate('pdfUrl', res.data.url);
            toast.success('PDF uploaded!');
        } catch (e) {
            toast.error('Failed to upload PDF');
        } finally {
            onUploadEnd();
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 100px', gap: '10px', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid #f8fafc' }}>
            <input type="text" value={yearItem.year} onChange={e => onUpdate('year', e.target.value)} placeholder="e.g. 2022-23" style={inputStyle} />
            <div onClick={() => document.getElementById(`pdf-${yearItem.id}`).click()}
                style={{ padding: '9px 12px', border: '1px dashed #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: yearItem.pdfUrl ? '#15803d' : '#64748b', background: yearItem.pdfUrl ? '#f0fdf4' : '#fafafa', textAlign: 'center' }}>
                {uploading ? 'Uploading...' : yearItem.pdfUrl ? '✓ PDF uploaded — click to change' : '📄 Click to upload PDF'}
            </div>
            <input id={`pdf-${yearItem.id}`} type="file" accept="application/pdf" onChange={e => { const f = e.target.files[0]; if (f) handlePdfUpload(f); }} style={{ display: 'none' }} />
            <button onClick={onRemove} style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '12px', padding: '9px' }}>Remove</button>
        </div>
    );
};

export default Sports;