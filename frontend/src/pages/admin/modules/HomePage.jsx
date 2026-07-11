import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi } from '../../../api/content.api';
import { uploadHeroVideoApi } from '../../../api/school.api';
import toast from 'react-hot-toast';
import RichTextEditor from '../../../components/common/RichTextEditor';
import useSchoolStore from '../../../store/schoolStore';

const VideoIcon = ({ size = 28, color = '#94a3b8' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
);

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const defaultContent = {
    tagline: '',
    subText: '',
};

const HomePage = () => {
    const { tc, school, fetchSchool } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [videoTitle, setVideoTitle] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [uploadingVideo, setUploadingVideo] = useState(false);

    useEffect(() => { fetchContent(); }, []);

    useEffect(() => {
        if (school) setVideoTitle(school.hero_video_title || '');
    }, [school]);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('home');
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

    const inputStyle = {
        width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0',
        borderRadius: '6px', fontSize: '13.5px', color: '#0f172a', outline: 'none',
        boxSizing: 'border-box', background: '#ffffff', fontFamily: 'system-ui, sans-serif',
        transition: 'border 0.2s, box-shadow 0.2s'
    };

    const labelStyle = {
        display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
    };

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
                .hp-section { animation: fadeInUp 0.35s ease forwards; }
                .hp-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; }
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

            <div style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* Hero Header */}
                <div style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '10px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: '-140px', right: '4%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Pages / Home Page</p>
                            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Home Page</h1>
                            <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '400px' }}>
                                Manage your school's home page hero text.
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '6px', flexShrink: 0 }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8' }}></div>
                            <span style={{ fontSize: '12px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                                {isPublished ? 'Published' : 'Draft'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Hero Video ── */}
                <div className="hp-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '1.25rem' }}>
                    <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#1a1a2e,#0f3460)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(15,52,96,0.3)' }}>
                            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Hero Video</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>Background video that plays behind the home page hero text</p>
                        </div>
                    </div>
                    <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={labelStyle}>Video Title (optional)</label>
                                <input type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="e.g. Campus Life 2024" style={inputStyle} />
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
                                        <div style={{ position: 'absolute', top: '10px', right: '10px', padding: '4px 10px', background: 'rgba(34,197,94,0.9)', borderRadius: '20px', fontSize: '11px', color: '#fff', fontWeight: 600 }}>Live ✓</div>
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
                </div>

                {/* ── Hero Section ── */}
                <div className="hp-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
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
                            <label style={labelStyle}>School Tagline *</label>
                            <input className="hp-input" type="text" value={content.tagline} onChange={e => handleChange('tagline', e.target.value)}
                                placeholder="e.g. Empowering Young Minds Since 1998" style={inputStyle} />
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>This is the big headline on your home page</p>
                        </div>
                        <div>
    <label style={labelStyle}>Sub Text</label>
    <RichTextEditor value={content.subText} onChange={val => handleChange('subText', val)}
        placeholder="e.g. A premier institution dedicated to academic excellence, character building and holistic development."
        minHeight="80px" />
    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>Supporting text below the tagline</p>
</div>

                        {/* Live Preview */}
                        {(content.tagline || content.subText) && (
                            <div style={{ padding: '1.5rem', background: `linear-gradient(135deg,${tc.dark},${tc.primary})`, borderRadius: '8px', border: `1px solid ${hexToRgba(tc.primary, 0.3)}` }}>
                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Preview</p>
                                {content.tagline && <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.5px' }}>{content.tagline}</h2>}
                                {content.subText && <div className="rte-content" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: content.subText }} />}
                            </div>
                        )}
                    </div>
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
                            style={{ padding: '11px 28px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {publishing ? <><svg style={{ animation: 'spin 1s linear infinite', width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Publishing...</> : 'Publish Page'}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default HomePage;
