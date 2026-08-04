import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadContentImageApi } from '../../../api/content.api';
import { uploadHeroVideoApi, updateSchoolProfileApi } from '../../../api/school.api';
import toast from 'react-hot-toast';
import RichTextEditor from '../../../components/common/RichTextEditor';
import ImageCropModal from '../../../components/common/ImageCropModal';
import useSchoolStore from '../../../store/schoolStore';
import { FONT_OPTIONS, getFontFamily } from '../../../constants/fonts';

const VideoIcon = ({ size = 28, color = '#94a3b8' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
);

const BannerIcon = ({ size = 28, color = '#94a3b8' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" /></svg>
);

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const defaultContent = {
    tagline: '',
    subText: '',
    heroBgType: 'video', // 'video' | 'banner'
    heroBanners: [], // [{ id, url }]
    schoolNameColor: '',
    schoolNameFont: '',
    taglineColor: '',
    subTextColor: '',
};

// ── Small inline color-picker used for the hero text-color overrides ──
const ColorField = ({ label, hint, value, onChange, defaultColor }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>{label}</span>
        <label style={{ position: 'relative', width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #e2e8f0', overflow: 'hidden', cursor: 'pointer', background: value || defaultColor, flexShrink: 0 }}>
            <input type="color" value={value || defaultColor} onChange={e => onChange(e.target.value)}
                style={{ position: 'absolute', inset: 0, width: '150%', height: '150%', top: '-25%', left: '-25%', border: 'none', cursor: 'pointer', padding: 0 }} />
        </label>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{value ? value.toUpperCase() : 'Default'}</span>
        {value && (
            <button type="button" onClick={() => onChange('')}
                style={{ fontSize: '11px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                Reset
            </button>
        )}
        {hint && <span style={{ fontSize: '10.5px', color: '#cbd5e1', width: '100%' }}>{hint}</span>}
    </div>
);

// ── Small inline font-family picker, paired next to ColorField for the same hero text ──
const FontField = ({ label, value, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>{label}</span>
        <select value={value || ''} onChange={e => onChange(e.target.value)}
            style={{ fontSize: '12px', padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#0f172a', background: '#ffffff', cursor: 'pointer', outline: 'none' }}>
            <option value="">Default</option>
            {FONT_OPTIONS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
    </div>
);

const HomePage = () => {
    const { tc, bc, school, fetchSchool } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [videoTitle, setVideoTitle] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [removingVideo, setRemovingVideo] = useState(false);
    const [uploadingBanners, setUploadingBanners] = useState(false);
    const [cropSrc, setCropSrc] = useState(null);
    const [imageQueue, setImageQueue] = useState([]); // remaining banner files still waiting to be cropped

    useEffect(() => { fetchContent(); }, []);

    useEffect(() => {
        if (school) setVideoTitle(school.hero_video_title || '');
    }, [school]);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('home');
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

    const handleChange = (field, value) => {
        setContent(prev => ({ ...prev, [field]: value }));
    };

    const fetchPublishedFlag = async () => {
        const res = await getModuleContentApi('home');
        return !!res?.data?.is_published;
    };

    const handleSave = async (publish = false) => {
        publish ? setPublishing(true) : setSaving(true);
        try {
            await saveModuleContentApi('home', content, publish ? 1 : isPublished ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                // Save never touches is_published — flip it server-side only if not already live.
                let current = await fetchPublishedFlag();
                if (!current) {
                    await togglePublishApi('home', 1);
                    current = await fetchPublishedFlag();
                }
                setIsPublished(current);
                toast.success('Home page published!');
            } else {
                toast.success('Content saved!');
            }
        } catch (e) {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
            setPublishing(false);
        }
    };

    const handleUnpublish = async () => {
        try {
            let current = await fetchPublishedFlag();
            if (current) {
                await togglePublishApi('home', 0);
                current = await fetchPublishedFlag();
            }
            setIsPublished(current);
            toast.success('Unpublished');
        } catch (e) {
            toast.error('Failed to unpublish');
        }
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) { setVideoFile(file); setVideoPreview(URL.createObjectURL(file)); }
    };

    // Each banner is cropped one at a time (freeform, adjustable from every side) before
    // upload. Once confirmed, the next queued file automatically opens in the crop modal.
    const handleBannerFilesSelected = (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (files.length === 0) return;
        setImageQueue(files.slice(1));
        setCropSrc(URL.createObjectURL(files[0]));
    };

    const onBannerCropConfirmed = async (croppedFile) => {
        setCropSrc(null);
        setUploadingBanners(true);
        try {
            const res = await uploadContentImageApi(croppedFile);
            setContent(prev => ({ ...prev, heroBanners: [...prev.heroBanners, { id: `banner-${Date.now()}`, url: res.data.url }] }));
        } catch (e) {
            toast.error('Failed to upload banner image');
        } finally {
            setUploadingBanners(false);
            if (imageQueue.length > 0) {
                const [next, ...rest] = imageQueue;
                setImageQueue(rest);
                setCropSrc(URL.createObjectURL(next));
            }
        }
    };

    const removeBanner = (id) => {
        setContent(prev => ({ ...prev, heroBanners: prev.heroBanners.filter(b => b.id !== id) }));
    };

    const handleVideoUpload = async () => {
        if (!videoFile) { toast.error('Please select a video file'); return; }
        setUploadingVideo(true);
        try {
            const formData = new FormData();
            formData.append('heroVideo', videoFile);
            formData.append('title', videoTitle);
            await uploadHeroVideoApi(formData);
            await fetchSchool();
            toast.success('Hero video uploaded successfully!');
            setVideoFile(null);
            setVideoPreview(null);
        } catch (e) {
            toast.error('Failed to upload video');
        } finally {
            setUploadingVideo(false);
        }
    };

    const handleVideoRemove = async () => {
        setRemovingVideo(true);
        try {
            await updateSchoolProfileApi({ hero_video_url: null, hero_video_title: null });
            await fetchSchool();
            setVideoTitle('');
            setVideoFile(null);
            setVideoPreview(null);
            toast.success('Hero video removed');
        } catch (e) {
            toast.error('Failed to remove video');
        } finally {
            setRemovingVideo(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '11px 14px', border: '1px solid #e5e9f0',
        borderRadius: '10px', fontSize: '13.5px', color: '#0f172a', outline: 'none',
        boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'system-ui, sans-serif',
        transition: 'border 0.2s, box-shadow 0.2s, background 0.2s'
    };

    const labelStyle = {
        display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
    };

    const isDirty = savedSnapshot !== null && JSON.stringify(content) !== savedSnapshot;

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes drift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-24px, 18px) scale(1.08); } }
                .hp-section { animation: fadeInUp 0.35s ease forwards; }
                .hp-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .hp-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .hp-hero-orb { animation: drift1 9s ease-in-out infinite; }
                @media (max-width: 700px) {
                    .hp-2col { grid-template-columns: 1fr !important; }
                }
                .rte-content p { margin-bottom: 0.8em; }
                .rte-content p:last-child { margin-bottom: 0; }
                .rte-content strong { font-weight: 700; }
                .rte-content em { font-style: italic; }
                .rte-content u { text-decoration: underline; }
                .rte-content ul, .rte-content ol { padding-left: 1.5em; margin-bottom: 0.8em; }
                .rte-content .ql-size-small { font-size: 0.75em; }
                .rte-content .ql-size-large { font-size: 1.5em; }
                .rte-content .ql-size-huge { font-size: 2.5em; }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif', background: bc.surface, margin: '-24px', padding: '24px', minHeight: '100vh' }}>

                {/* Hero Header */}
                <div style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '22px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                    <div className="hp-hero-orb" style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: '-140px', right: '4%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                        <div className="hp-hero-item">
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Pages / Home Page</p>
                            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Home Page</h1>
                            <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '400px' }}>
                                Manage your school's home page hero text.
                            </p>
                        </div>
                        <div className="hp-hero-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '6px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8' }}></div>
                                <span style={{ fontSize: '12px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                                    {isPublished ? 'Published' : 'Draft'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
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
                                        style={{ padding: '7px 16px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: `0 2px 10px ${hexToRgba(tc.primary, 0.35)}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {publishing ? <><svg style={{ animation: 'spin 1s linear infinite', width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Publishing...</> : 'Publish'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Hero Background ── */}
                <div className="hp-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '1.25rem' }}>
                    <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#1a1a2e,#0f3460)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(15,52,96,0.3)' }}>
                            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Hero Background</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>Video or rotating banner images behind the home page hero text</p>
                        </div>
                    </div>

                    {/* Type toggle */}
                    <div style={{ padding: '1.25rem 1.75rem 0' }}>
                        <div style={{ display: 'inline-flex', padding: '4px', background: '#f1f5f9', borderRadius: '8px', gap: '4px' }}>
                            <button onClick={() => handleChange('heroBgType', 'video')}
                                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', background: content.heroBgType === 'video' ? '#ffffff' : 'transparent', color: content.heroBgType === 'video' ? '#0f172a' : '#64748b', boxShadow: content.heroBgType === 'video' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <VideoIcon size={14} color={content.heroBgType === 'video' ? tc.primary : '#94a3b8'} /> Video
                            </button>
                            <button onClick={() => handleChange('heroBgType', 'banner')}
                                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', background: content.heroBgType === 'banner' ? '#ffffff' : 'transparent', color: content.heroBgType === 'banner' ? '#0f172a' : '#64748b', boxShadow: content.heroBgType === 'banner' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <BannerIcon size={14} color={content.heroBgType === 'banner' ? tc.primary : '#94a3b8'} /> Banner Slideshow
                            </button>
                        </div>
                    </div>

                    {content.heroBgType === 'video' ? (
                        <div className="hp-2col" style={{ padding: '1.75rem 2rem 2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>Video Title (optional)</label>
                                    <input type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="Enter Video Title" style={inputStyle} />
                                </div>
                                <div onClick={() => document.getElementById('heroVideoInput').click()}
                                    style={{ border: '1.5px dashed #e2e8f0', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: videoFile ? '#f8fafc' : '#fafafa' }}>
                                    {videoFile ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                                            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,#1a1a2e,#0f3460)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                            </div>
                                            <div style={{ textAlign: 'left' }}>
                                                <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', marginBottom: '2px' }}>{videoFile.name}</p>
                                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>{(videoFile.size / (1024 * 1024)).toFixed(1)} MB · Click to change</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><VideoIcon /></div>
                                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Click to upload hero video</p>
                                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>MP4, WEBM, MOV · Max 50MB</p>
                                        </>
                                    )}
                                </div>
                                <input id="heroVideoInput" type="file" accept="video/mp4,video/webm,video/mov" onChange={handleVideoChange} style={{ display: 'none' }} />
                                <button onClick={handleVideoUpload} disabled={uploadingVideo || !videoFile}
                                    style={{ padding: '11px', background: uploadingVideo || !videoFile ? hexToRgba(tc.primary, 0.3) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: uploadingVideo || !videoFile ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    {uploadingVideo ? <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Uploading...</> : <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>Upload Hero Video</>}
                                </button>
                            </div>

                            <div>
                                {videoPreview || school?.hero_video_url ? (
                                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '0.5px solid #e2e8f0', position: 'relative' }}>
                                        <video src={videoPreview || school.hero_video_url} autoPlay muted loop playsInline style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
                                        {!videoPreview && (
                                            <>
                                                <div style={{ position: 'absolute', top: '10px', left: '10px', padding: '4px 10px', background: 'rgba(34,197,94,0.9)', borderRadius: '20px', fontSize: '11px', color: '#fff', fontWeight: 600 }}>Live ✓</div>
                                                <button type="button" onClick={handleVideoRemove} disabled={removingVideo}
                                                    style={{ position: 'absolute', top: '10px', right: '10px', width: '26px', height: '26px', background: 'rgba(15,23,42,0.7)', color: '#fff', border: 'none', borderRadius: '50%', cursor: removingVideo ? 'wait' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Remove hero video">×</button>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ height: '200px', background: '#f8fafc', borderRadius: '8px', border: '1.5px dashed #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <VideoIcon size={32} />
                                        <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>No video uploaded yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '1.75rem 2rem 2rem' }}>
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px' }}>
                                Upload multiple images — they'll auto-rotate with a fade every 8 seconds behind the hero text. Wide images (16:9 or wider) work best. You'll get a crop tool for each image (freely adjustable from every side) before it's added. JPG, PNG, WEBP · Max 5MB each.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                                {content.heroBanners.map((b, i) => (
                                    <div key={b.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '0.5px solid #e2e8f0', height: '90px' }}>
                                        <img src={b.url} alt={`Banner ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        <button onClick={() => removeBanner(b.id)}
                                            style={{ position: 'absolute', top: '5px', right: '5px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            ✕
                                        </button>
                                        <div style={{ position: 'absolute', bottom: '5px', left: '6px', fontSize: '10px', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '1px 6px', borderRadius: '4px' }}>#{i + 1}</div>
                                    </div>
                                ))}
                                <div onClick={() => document.getElementById('heroBannerInput').click()}
                                    style={{ height: '90px', border: '1.5px dashed #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: uploadingBanners ? 'not-allowed' : 'pointer', background: '#fafafa' }}>
                                    {uploadingBanners ? (
                                        <svg style={{ animation: 'spin 1s linear infinite', width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke={tc.primary} strokeWidth="4"/><path style={{ opacity: 0.75 }} fill={tc.primary} d="M4 12a8 8 0 018-8v8z"/></svg>
                                    ) : (
                                        <>
                                            <BannerIcon size={20} />
                                            <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Add Banner(s)</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <input id="heroBannerInput" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple onChange={handleBannerFilesSelected} style={{ display: 'none' }} />
                            {content.heroBanners.length === 0 && (
                                <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '10px' }}>No banners uploaded yet — until you add at least one, the video (or theme gradient) will show instead.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Hero Section ── */}
                <div className="hp-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Hero Section</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>Main headline and subtext shown on home page</p>
                        </div>
                    </div>
                    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={labelStyle}>School Name (shown in hero)</label>
                            <input type="text" value={school?.name || ''} disabled
                                style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }} />
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>Edit the name itself in Settings — pick its hero display color and font here.</p>
                            <ColorField label="School Name Color" value={content.schoolNameColor} defaultColor="#ffffff"
                                hint="Leave blank to keep the animated gradient effect; pick a color for a solid override."
                                onChange={val => handleChange('schoolNameColor', val)} />
                            <FontField label="School Name Font" value={content.schoolNameFont} onChange={val => handleChange('schoolNameFont', val)} />
                        </div>
                        <div>
                            <label style={labelStyle}>School Tagline *</label>
                            <input className="hp-input" type="text" value={content.tagline} onChange={e => handleChange('tagline', e.target.value)}
                                placeholder="Enter School Tagline" style={inputStyle} />
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>This is the big headline on your home page — e.g. "Empowering Young Minds Since 1998"</p>
                            <ColorField label="Tagline Color" value={content.taglineColor} defaultColor={tc.secondary}
                                onChange={val => handleChange('taglineColor', val)} />
                            <FontField label="Tagline Font" value={content.taglineFont} onChange={val => handleChange('taglineFont', val)} />
                        </div>
                        <div>
    <label style={labelStyle}>Sub Text</label>
    <RichTextEditor value={content.subText} onChange={val => handleChange('subText', val)}
        placeholder="Enter Sub Text"
        minHeight="80px"
        maxWidth="1070px" fontSize="18px" fontFamily="'Inter', system-ui, sans-serif" />
    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>Supporting text below the tagline</p>
    <ColorField label="Sub Text Color" value={content.subTextColor} defaultColor="#ffffff"
        hint="Default renders at partial opacity; a custom color renders at full opacity."
        onChange={val => handleChange('subTextColor', val)} />
    <FontField label="Sub Text Font" value={content.subTextFont} onChange={val => handleChange('subTextFont', val)} />
</div>

                        {/* Live Preview */}
                        {(school?.name || content.tagline || content.subText) && (
                            <div style={{ padding: '1.5rem', background: `linear-gradient(135deg,${tc.dark},${tc.primary})`, borderRadius: '8px', border: `1px solid ${hexToRgba(tc.primary, 0.3)}` }}>
                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Preview</p>
                                {school?.name && <h1 style={{ fontFamily: getFontFamily(content.schoolNameFont), fontSize: '28px', fontWeight: 900, color: content.schoolNameColor || '#ffffff', marginBottom: '6px', letterSpacing: '-1px' }}>{school.name}</h1>}
                                {content.tagline && <h2 style={{ fontSize: '20px', fontWeight: 700, color: content.taglineColor || tc.secondary, marginBottom: '8px', letterSpacing: '-0.3px' }}>{content.tagline}</h2>}
                                {content.subText && <div className="rte-content" style={{ fontSize: '14px', color: content.subTextColor || 'rgba(255,255,255,0.55)', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: content.subText }} />}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    aspect={null}
                    onCancel={() => { setCropSrc(null); setImageQueue([]); }}
                    onCropComplete={onBannerCropConfirmed}
                />
            )}
        </>
    );
};

export default HomePage;
