import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadPdfApi } from '../../../api/content.api';
import RichTextEditor from '../../../components/common/RichTextEditor';
import ItalicToggle from '../../../components/common/ItalicToggle';
import HeadingStyleField from '../../../components/common/HeadingStyleField';
import ImageSizeHint from '../../../components/admin/ImageSizeHint';
import useSchoolStore from '../../../store/schoolStore';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const defaultContent = { heading: '', description: '', formPdfUrl: '', formLinkUrl: '' };

const AdmissionProcedure = () => {
    const { tc, bc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [uploadingForm, setUploadingForm] = useState(false);

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('admissionProcedure');
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
        const res = await getModuleContentApi('admissionProcedure');
        return !!res?.data?.is_published;
    };

    const handleSave = async (publish = false) => {
        publish ? setPublishing(true) : setSaving(true);
        try {
            await saveModuleContentApi('admissionProcedure', content, publish ? 1 : isPublished ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                let current = await fetchPublishedFlag();
                if (!current) {
                    await togglePublishApi('admissionProcedure', 1);
                    current = await fetchPublishedFlag();
                }
                setIsPublished(current);
                toast.success('Admission Procedure published! 🎉');
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
                await togglePublishApi('admissionProcedure', 0);
                current = await fetchPublishedFlag();
            }
            setIsPublished(current);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed'); }
    };

    const updateField = (field, value) => setContent(prev => ({ ...prev, [field]: value }));

    const handleFormUpload = async (file) => {
        setUploadingForm(true);
        try {
            const res = await uploadPdfApi(file);
            updateField('formPdfUrl', res.data.url);
        } catch (e) { toast.error('Failed to upload'); }
        finally { setUploadingForm(false); }
    };

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
                .ap-section { animation: fadeInUp 0.35s ease forwards; }
                @media (max-width: 640px) {
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .ap-hero-inner { gap: 12px !important; }
                    .ap-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .ap-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .ap-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .ap-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .ap-status-badge { padding: 4px 9px !important; }
                    .ap-status-badge span { font-size: 9.5px !important; }
                    .ap-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }
                }
                .ap-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .ap-section-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: linear-gradient(135deg, ${tc.primary}, ${tc.secondary}); margin-right: 8px; }
                .ap-pdf { transition: border-color 0.2s ease, transform 0.2s ease; }
                .ap-pdf:hover { transform: translateY(-1px); }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif', background: bc.surface, margin: '-24px', padding: '24px', minHeight: '100vh' }}>

                {/* Hero Header */}
                <div className="dash-hero" style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '22px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                    <div className="ap-hero-inner" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div className="ap-hero-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                            <div>
                                <p className="ap-hero-eyebrow" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Pages / Admission Procedure</p>
                                <h1 className="ap-hero-title" style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Admission Procedure</h1>
                                <p className="ap-hero-desc" style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px' }}>
                                    A short intro and an admission form attachment for parents on your website's Admission Procedure page.
                                </p>
                            </div>
                            <div className="ap-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 11px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '999px', flexShrink: 0 }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8', flexShrink: 0 }}></div>
                                <span style={{ fontSize: '10.5px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{isPublished ? 'Published' : 'Draft'}</span>
                            </div>
                        </div>
                        <div className="ap-hero-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => handleSave(false)} disabled={saving}
                                style={{ padding: '7px 14px', background: isDirty ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.08)', color: isDirty ? '#fde047' : 'rgba(255,255,255,0.65)', border: isDirty ? '1px solid rgba(250,204,21,0.35)' : '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', fontSize: '12px', fontWeight: isDirty ? 700 : 500, cursor: 'pointer' }}>
                                {saving ? 'Saving...' : isDirty ? '● Save' : 'Save'}
                            </button>
                            {isPublished ? (
                                <button onClick={handleUnpublish}
                                    style={{ padding: '7px 14px', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                    Unpublish
                                </button>
                            ) : (
                                <button onClick={() => handleSave(true)} disabled={publishing}
                                    style={{ padding: '7px 16px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: `0 2px 10px ${hexToRgba(tc.primary, 0.35)}` }}>
                                    {publishing ? 'Publishing...' : 'Publish'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="ap-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Top section — heading + description */}
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div>
                            <label style={labelStyle}><span className="ap-section-dot"></span>Heading</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="ap-input" type="text" value={content.heading} onChange={e => updateField('heading', e.target.value)}
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
                                placeholder="A short intro about how admissions work at your school..." minHeight="120px" fontSize="15px" />
                        </div>
                    </div>

                    {/* Admission Form Attachment */}
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <label style={labelStyle}><span className="ap-section-dot"></span>Admission Form Attachment</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>PDF (optional)</label>
                                <label className="ap-pdf" style={{ display: 'block', padding: '11px 14px', border: content.formPdfUrl ? '1.5px solid #bbf7d0' : '1.5px dashed #cbd5e1', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', color: content.formPdfUrl ? '#15803d' : '#64748b', background: content.formPdfUrl ? '#f0fdf4' : '#fafafa', textAlign: 'center' }}>
                                    {uploadingForm ? 'Uploading...' : content.formPdfUrl ? '✓ PDF uploaded — click to change' : '📄 Click to upload Admission Form PDF'}
                                    <input type="file" accept="application/pdf" style={{ display: 'none' }}
                                        onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleFormUpload(f); }} />
                                </label>
                                <ImageSizeHint>Under 10MB. Parents download this directly to fill and submit.</ImageSizeHint>
                            </div>
                            <div>
                                <label style={labelStyle}>Or Link URL (optional)</label>
                                <input className="ap-input" type="text" value={content.formLinkUrl || ''} onChange={e => updateField('formLinkUrl', e.target.value)} placeholder="https://..." style={inputStyle} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdmissionProcedure;
