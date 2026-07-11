import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadContentImageApi, uploadVideoFileApi } from '../../../api/content.api';
import ImageCropModal from '../../../components/common/ImageCropModal';
import useSchoolStore from '../../../store/schoolStore';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

// ── Icons (SVG, no emojis) ──
const IconFolder = ({ size = 28, color = '#8b2252' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
);
const IconImage = ({ size = 16, color = '#94a3b8' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
    </svg>
);
const IconVideo = ({ size = 16, color = '#94a3b8' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.55-2.27A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);
const IconPlus = ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);
const IconClose = ({ size = 12, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const IconHome = ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z" />
    </svg>
);
const IconCheck = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);
const IconUpload = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);
const IconLink = ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
    </svg>
);
const IconFile = ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" />
    </svg>
);
const IconSpinner = ({ size = 24, color = '#8b2252' }) => (
    <div style={{ width: size, height: size, border: '3px solid #f0c4c4', borderTop: `3px solid ${color}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }}></div>
);

const defaultContent = {
    photoBanner: '',
    videoBanner: '',
    photoNodes: [],
    videoNodes: [],
};

const Gallery = () => {
    const { tc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [activeTree, setActiveTree] = useState('photo');
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [uploading, setUploading] = useState({});
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [cropTarget, setCropTarget] = useState(null);
    const [coverCropTarget, setCoverCropTarget] = useState(null); // { folderId, src }

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('gallery');
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
        const res = await getModuleContentApi('gallery');
        return !!res?.data?.is_published;
    };

    const handleSave = async (publish = false) => {
        publish ? setPublishing(true) : setSaving(true);
        try {
            await saveModuleContentApi('gallery', content, publish ? 1 : isPublished ? 1 : 0);
            if (publish) {
                let current = await fetchPublishedFlag();
                if (!current) {
                    await togglePublishApi('gallery', 1);
                    current = await fetchPublishedFlag();
                }
                setIsPublished(current);
                toast.success('Gallery published!');
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
                await togglePublishApi('gallery', 0);
                current = await fetchPublishedFlag();
            }
            setIsPublished(current);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed'); }
    };

    const nodesKey = activeTree === 'photo' ? 'photoNodes' : 'videoNodes';
    const bannerKey = activeTree === 'photo' ? 'photoBanner' : 'videoBanner';
    const nodes = content[nodesKey] || [];

    const updateNodes = (newNodes) => setContent(prev => ({ ...prev, [nodesKey]: newNodes }));
    const updateBanner = (url) => setContent(prev => ({ ...prev, [bannerKey]: url }));

   const createFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder = { id: `f-${Date.now()}`, parentId: currentFolderId, type: 'folder', name: newFolderName.trim(), images: [], videos: [], coverImage: '' };
    updateNodes([...nodes, newFolder]);
    setNewFolderName('');
    setShowNewFolder(false);
    toast.success('Folder created');
};

    const renameFolder = (id, name) => updateNodes(nodes.map(n => n.id === id ? { ...n, name } : n));

    const deleteFolder = (id) => {
        const idsToDelete = new Set([id]);
        let changed = true;
        while (changed) {
            changed = false;
            nodes.forEach(n => {
                if (idsToDelete.has(n.parentId) && !idsToDelete.has(n.id)) {
                    idsToDelete.add(n.id);
                    changed = true;
                }
            });
        }
        updateNodes(nodes.filter(n => !idsToDelete.has(n.id)));
        toast.success('Folder deleted');
    };

    const getFolder = (id) => nodes.find(n => n.id === id);
    const childFolders = nodes.filter(n => n.parentId === currentFolderId);
    const currentFolder = currentFolderId ? getFolder(currentFolderId) : null;

    const breadcrumb = [];
    let cursor = currentFolderId;
    while (cursor) {
        const f = getFolder(cursor);
        if (!f) break;
        breadcrumb.unshift(f);
        cursor = f.parentId;
    }

    // ── Image ops ──
    const addImages = async (files) => {
        if (!currentFolderId) { toast.error('Open a folder first to add photos'); return; }
        setUploading(prev => ({ ...prev, images: true }));
        try {
            const urls = [];
            for (const file of files) {
                const res = await uploadContentImageApi(file);
                urls.push(res.data.url);
            }
            updateNodes(nodes.map(n => n.id === currentFolderId ? { ...n, images: [...(n.images || []), ...urls] } : n));
            toast.success(`${urls.length} photo(s) added`);
        } catch (e) { toast.error('Failed to upload'); }
        finally { setUploading(prev => ({ ...prev, images: false })); }
    };
    const uploadFolderCover = async (folderId, file) => {
    setUploading(prev => ({ ...prev, [`cover-${folderId}`]: true }));
    try {
        const res = await uploadContentImageApi(file);
        updateNodes(nodes.map(n => n.id === folderId ? { ...n, coverImage: res.data.url } : n));
        toast.success('Cover image set');
    } catch (e) { toast.error('Failed to upload'); }
    finally { setUploading(prev => ({ ...prev, [`cover-${folderId}`]: false })); }
};

    const removeImage = (idx) => updateNodes(nodes.map(n => n.id === currentFolderId ? { ...n, images: n.images.filter((_, i) => i !== idx) } : n));

    // ── Video ops ──
    // Each video item: { id, title, date, sourceType: 'youtube' | 'upload', youtubeUrl, videoUrl }
    const addVideo = () => {
        if (!currentFolderId) { toast.error('Open a folder first to add videos'); return; }
        updateNodes(nodes.map(n => n.id === currentFolderId
            ? { ...n, videos: [...(n.videos || []), { id: `vid-${Date.now()}`, title: '', date: '', sourceType: 'youtube', youtubeUrl: '', videoUrl: '' }] }
            : n));
    };

    const updateVideo = (videoId, field, value) => updateNodes(nodes.map(n => n.id === currentFolderId ? { ...n, videos: n.videos.map(v => v.id === videoId ? { ...v, [field]: value } : v) } : n));
    const removeVideo = (videoId) => updateNodes(nodes.map(n => n.id === currentFolderId ? { ...n, videos: n.videos.filter(v => v.id !== videoId) } : n));

    const uploadVideoFile = async (videoId, file) => {
        setUploading(prev => ({ ...prev, [`vidfile-${videoId}`]: true }));
        try {
            const res = await uploadVideoFileApi(file);
            updateVideo(videoId, 'videoUrl', res.data.url);
            toast.success('Video uploaded');
        } catch (e) {
            toast.error('Failed to upload video');
        } finally {
            setUploading(prev => ({ ...prev, [`vidfile-${videoId}`]: false }));
        }
    };

    // ── Crop flow for banner ──
    const onBannerFileSelected = (file) => {
        const src = URL.createObjectURL(file);
        setCropTarget({ src, mode: 'banner' });
    };

    const onCropConfirmed = async (croppedFile) => {
        setCropTarget(null);
        setUploading(prev => ({ ...prev, banner: true }));
        try {
            const res = await uploadContentImageApi(croppedFile);
            updateBanner(res.data.url);
            toast.success('Banner uploaded');
        } catch (e) { toast.error('Failed to upload'); }
        finally { setUploading(prev => ({ ...prev, banner: false })); }
    };

    const inputStyle = {
        width: '100%', padding: '10px 13px', border: '1px solid #e5e7eb',
        borderRadius: '10px', fontSize: '13px', color: '#0f172a', outline: 'none',
        boxSizing: 'border-box', background: '#ffffff', fontFamily: 'system-ui, sans-serif',
        transition: 'border-color 0.15s, box-shadow 0.15s',
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <IconSpinner size={40} color={tc.primary} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .gallery-section { animation: fadeInUp 0.35s ease forwards; }
                .folder-card { transition: all 0.18s cubic-bezier(0.16,1,0.3,1); cursor: pointer; }
                .folder-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(15,23,42,0.1) !important; border-color: #f0c4c4 !important; }
                .crumb:hover { color: ${tc.primary} !important; cursor: pointer; }
                .source-toggle { transition: all 0.15s; cursor: pointer; }
                input[type=text]:focus, input[type=date]:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* ── Hero Header ── */}
                <div style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '10px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: '-140px', right: '4%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Pages / Gallery</p>
                            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Photo & Video Gallery</h1>
                            <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px' }}>
                                Organize photos and videos in nested folders — just like on your computer.
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '6px', flexShrink: 0 }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8' }}></div>
                            <span style={{ fontSize: '12px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{isPublished ? 'Published' : 'Draft'}</span>
                        </div>
                    </div>
                </div>

                {/* ── Tree Switcher ── */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                    {[{ key: 'photo', label: 'Photo Gallery', Icon: IconImage }, { key: 'video', label: 'Video Gallery', Icon: IconVideo }].map(t => (
                        <button key={t.key} onClick={() => { setActiveTree(t.key); setCurrentFolderId(null); }}
                            style={{ padding: '10px 20px', borderRadius: '10px', border: activeTree === t.key ? `1.5px solid ${tc.primary}` : '1px solid #e5e7eb', fontSize: '13px', cursor: 'pointer', background: activeTree === t.key ? tc.light : '#ffffff', color: activeTree === t.key ? tc.primary : '#64748b', fontWeight: activeTree === t.key ? 600 : 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <t.Icon size={16} color={activeTree === t.key ? tc.primary : '#94a3b8'} />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Banner upload — only at root ── */}
                {!currentFolderId && (
                    <div className="gallery-section" style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px', padding: '1.75rem', marginBottom: '1.25rem', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>{activeTree === 'photo' ? 'Photo' : 'Video'} Gallery Banner</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '1rem' }}>Shown at the top of this gallery page — crop tool will open after selecting an image</p>
                        <div onClick={() => document.getElementById(`banner-${activeTree}`).click()}
                            style={{ border: '1.5px dashed #e5e7eb', borderRadius: '14px', padding: content[bannerKey] ? 0 : '2rem', textAlign: 'center', cursor: 'pointer', background: content[bannerKey] ? 'transparent' : '#fafafa', overflow: 'hidden', minHeight: content[bannerKey] ? '180px' : 'auto', position: 'relative' }}>
                            {uploading.banner ? (
                                <div style={{ padding: '2rem' }}><IconSpinner color={tc.primary} /></div>
                            ) : content[bannerKey] ? (
                                <img src={content[bannerKey]} alt="" style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                            ) : (
                                <>
                                    <IconUpload size={26} color="#94a3b8" />
                                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '10px' }}>Click to upload banner — recommended 1920×1080</p>
                                </>
                            )}
                        </div>
                        <input id={`banner-${activeTree}`} type="file" accept="image/*"
                            onChange={e => { const f = e.target.files[0]; if (f) onBannerFileSelected(f); e.target.value = ''; }}
                            style={{ display: 'none' }} />
                    </div>
                )}

                {/* ── Breadcrumb ── */}
                <div className="gallery-section" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <span className="crumb" onClick={() => setCurrentFolderId(null)} style={{ fontSize: '13px', color: !currentFolderId ? tc.primary : '#64748b', fontWeight: !currentFolderId ? 600 : 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconHome size={13} color={!currentFolderId ? tc.primary : '#94a3b8'} /> Root
                    </span>
                    {breadcrumb.map(f => (
                        <span key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#cbd5e1', fontSize: '13px' }}>/</span>
                            <span className="crumb" onClick={() => setCurrentFolderId(f.id)} style={{ fontSize: '13px', color: f.id === currentFolderId ? tc.primary : '#64748b', fontWeight: f.id === currentFolderId ? 600 : 500 }}>
                                {f.name}
                            </span>
                        </span>
                    ))}
                </div>

                {/* ── Folder grid + new folder ── */}
                <div className="gallery-section" style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px', padding: '1.75rem', marginBottom: '1.25rem', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Folders <span style={{ color: '#94a3b8', fontWeight: 400 }}>({childFolders.length})</span></p>
                        {!showNewFolder && (
                            <button onClick={() => setShowNewFolder(true)} style={{ padding: '8px 16px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <IconPlus size={12} /> New Folder
                            </button>
                        )}
                    </div>

                    {showNewFolder && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
                            <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                                placeholder="Folder name e.g. Annual Day 2024" style={inputStyle}
                                onKeyDown={e => e.key === 'Enter' && createFolder()} autoFocus />
                            <button onClick={createFolder} style={{ padding: '10px 18px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Create</button>
                            <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} style={{ padding: '10px 16px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                    )}

                    {childFolders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <IconFolder size={36} color="#e2e8f0" />
                            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '10px' }}>No folders here yet — create one to organize {activeTree === 'photo' ? 'photos' : 'videos'}</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
                            {childFolders.map(f => {
                                const subCount = nodes.filter(n => n.parentId === f.id).length;
                                const itemCount = activeTree === 'photo' ? (f.images || []).length : (f.videos || []).length;
                                return (
                                    <div key={f.id} className="folder-card" onClick={() => setCurrentFolderId(f.id)}
    style={{ border: '1px solid #f1f5f9', borderRadius: '14px', overflow: 'hidden', background: '#fafbfc', boxShadow: '0 1px 3px rgba(15,23,42,0.03)', position: 'relative' }}>
    <div style={{ height: '90px', background: f.coverImage ? 'transparent' : '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
        {f.coverImage && <img src={f.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        <button onClick={e => { e.stopPropagation(); document.getElementById(`cover-${f.id}`).click(); }}
            style={{ position: 'absolute', bottom: '6px', right: '6px', padding: '4px 8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {uploading[`cover-${f.id}`] ? '...' : 'Set Cover'}
        </button>
        <input id={`cover-${f.id}`} type="file" accept="image/*"
            onClick={e => e.stopPropagation()}
            onChange={e => {
                const file = e.target.files[0];
                e.target.value = '';
                if (file) setCoverCropTarget({ folderId: f.id, src: URL.createObjectURL(file) });
            }}
            style={{ display: 'none' }} />
        <button onClick={e => { e.stopPropagation(); if (window.confirm(`Delete folder "${f.name}" and everything inside it?`)) deleteFolder(f.id); }}
            style={{ position: 'absolute', top: '8px', right: '8px', width: '22px', height: '22px', background: '#ffffff', border: '1px solid #fecaca', borderRadius: '50%', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconClose size={10} />
        </button>
    </div>
    <div style={{ padding: '1rem 1.25rem' }}>
        <IconFolder size={24} color={tc.secondary} />
        <input type="text" value={f.name} onClick={e => e.stopPropagation()} onChange={e => renameFolder(f.id, e.target.value)}
            style={{ width: '100%', fontSize: '13.5px', fontWeight: 600, color: '#0f172a', border: 'none', background: 'transparent', outline: 'none', padding: 0, margin: '8px 0 4px' }} />
        <p style={{ fontSize: '11px', color: '#94a3b8' }}>
            {subCount > 0 ? `${subCount} subfolder${subCount > 1 ? 's' : ''}` : `${itemCount} ${activeTree === 'photo' ? 'photo' : 'video'}${itemCount !== 1 ? 's' : ''}`}
        </p>
    </div>
</div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Current folder content ── */}
                {currentFolderId && currentFolder && (
                    <div className="gallery-section" style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>

                        {activeTree === 'photo' && (
                            <>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '1.25rem' }}>Photos in "{currentFolder.name}" <span style={{ color: '#94a3b8', fontWeight: 400 }}>({(currentFolder.images || []).length})</span></p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', marginBottom: '1.25rem' }}>
                                    {(currentFolder.images || []).map((img, i) => (
                                        <div key={i} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '1' }}>
                                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', background: 'rgba(15,23,42,0.7)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <IconClose size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div onClick={() => document.getElementById('img-upload').click()}
                                    style={{ border: '1.5px dashed #e5e7eb', borderRadius: '14px', padding: '1.75rem', textAlign: 'center', cursor: 'pointer', background: '#fafbfc' }}>
                                    {uploading.images ? <IconSpinner size={22} color={tc.primary} /> : (
                                        <>
                                            <IconUpload size={20} color="#94a3b8" />
                                            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>Click to add photos (multiple allowed)</p>
                                        </>
                                    )}
                                </div>
                                <input id="img-upload" type="file" accept="image/*" multiple
                                    onChange={e => { const files = Array.from(e.target.files); if (files.length > 0) addImages(files); e.target.value = ''; }}
                                    style={{ display: 'none' }} />
                            </>
                        )}

                        {activeTree === 'video' && (
                            <>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '1.25rem' }}>Videos in "{currentFolder.name}" <span style={{ color: '#94a3b8', fontWeight: 400 }}>({(currentFolder.videos || []).length})</span></p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '1.25rem' }}>
                                    {(currentFolder.videos || []).map(v => {
                                        const isYoutube = (v.sourceType || 'youtube') === 'youtube';
                                        const uploadKey = `vidfile-${v.id}`;
                                        return (
                                            <div key={v.id} style={{ border: '1px solid #f1f5f9', borderRadius: '12px', padding: '1rem', background: '#fafbfc' }}>
                                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                                    <input type="text" value={v.title} onChange={e => updateVideo(v.id, 'title', e.target.value)} placeholder="Video Title" style={{ ...inputStyle, flex: 2 }} />
                                                    <input type="date" value={v.date} onChange={e => updateVideo(v.id, 'date', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                                    <button onClick={() => removeVideo(v.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#ef4444', cursor: 'pointer', width: '40px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <IconClose size={13} />
                                                    </button>
                                                </div>

                                                {/* Source type toggle */}
                                                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                                    <button className="source-toggle" onClick={() => updateVideo(v.id, 'sourceType', 'youtube')}
                                                        style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: isYoutube ? `1.5px solid ${tc.primary}` : '1px solid #e5e7eb', background: isYoutube ? tc.light : '#ffffff', color: isYoutube ? tc.primary : '#64748b', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                        <IconLink size={12} /> YouTube Link
                                                    </button>
                                                    <button className="source-toggle" onClick={() => updateVideo(v.id, 'sourceType', 'upload')}
                                                        style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: !isYoutube ? `1.5px solid ${tc.primary}` : '1px solid #e5e7eb', background: !isYoutube ? tc.light : '#ffffff', color: !isYoutube ? tc.primary : '#64748b', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                        <IconFile size={12} /> Upload from Device
                                                    </button>
                                                </div>

                                                {isYoutube ? (
                                                    <input type="text" value={v.youtubeUrl} onChange={e => updateVideo(v.id, 'youtubeUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." style={inputStyle} />
                                                ) : (
                                                    <div>
                                                        {v.videoUrl ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                                                                <IconCheck size={14} color="#15803d" />
                                                                <span style={{ fontSize: '12px', color: '#15803d', flex: 1 }}>Video uploaded</span>
                                                                <button onClick={() => document.getElementById(`vidfile-input-${v.id}`).click()} style={{ fontSize: '11px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Replace</button>
                                                            </div>
                                                        ) : (
                                                            <div onClick={() => document.getElementById(`vidfile-input-${v.id}`).click()}
                                                                style={{ border: '1.5px dashed #e5e7eb', borderRadius: '10px', padding: '1rem', textAlign: 'center', cursor: 'pointer', background: '#ffffff' }}>
                                                                {uploading[uploadKey] ? <IconSpinner size={20} color={tc.primary} /> : (
                                                                    <p style={{ fontSize: '12px', color: '#64748b' }}>Click to upload video file (MP4, max 50MB)</p>
                                                                )}
                                                            </div>
                                                        )}
                                                        <input id={`vidfile-input-${v.id}`} type="file" accept="video/mp4,video/webm,video/mov"
                                                            onChange={e => { const f = e.target.files[0]; if (f) uploadVideoFile(v.id, f); e.target.value = ''; }}
                                                            style={{ display: 'none' }} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <button onClick={addVideo} style={{ width: '100%', padding: '11px', background: 'transparent', border: '1.5px dashed #e5e7eb', borderRadius: '12px', fontSize: '13px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <IconPlus size={12} /> Add Video
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* ── Bottom Save Bar ── */}
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
                            style={{ padding: '11px 28px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {publishing ? 'Publishing...' : <><IconCheck size={14} /> Publish</>}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Crop Modal ── */}
            {cropTarget && (
                <ImageCropModal
                    imageSrc={cropTarget.src}
                    aspect={16 / 9}
                    onCancel={() => setCropTarget(null)}
                    onCropComplete={onCropConfirmed}
                />
            )}

            {coverCropTarget && (
                <ImageCropModal
                    imageSrc={coverCropTarget.src}
                    aspect={16 / 9}
                    onCancel={() => setCoverCropTarget(null)}
                    onCropComplete={(croppedFile) => {
                        const folderId = coverCropTarget.folderId;
                        setCoverCropTarget(null);
                        uploadFolderCover(folderId, croppedFile);
                    }}
                />
            )}
        </>
    );
};

export default Gallery;