import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";

// ── Icons (SVG, no emojis) ──
const IconFolder = ({ size = 22, color = '#8b2252' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
);
const IconImage = ({ size = 14, color = '#ffffff' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
    </svg>
);
const IconVideo = ({ size = 14, color = '#ffffff' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.55-2.27A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);
const IconHome = ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z" />
    </svg>
);
const IconChevronRight = ({ size = 13, color = '#cbd5e1' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);
const IconChevronLeft = ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);
const IconClose = ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const IconEmpty = ({ size = 44, color = '#e2e8f0' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h.01M15 15l-3-3-4 4M3 16l5-5 4 4 3-3 4 4" />
    </svg>
);
const IconSpinner = ({ size = 48, color = '#8b2252' }) => (
    <div style={{ width: size, height: size, border: '3px solid #f0c4c4', borderTop: `3px solid ${color}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
);

const useScrollReveal = () => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.1 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, visible];
};

const Reveal = ({ children, delay = 0, style = {} }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: `opacity 0.6s ease ${delay}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>
            {children}
        </div>
    );
};

const GalleryPublic = () => {
    const { slug, tab } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [lightbox, setLightbox] = useState(null);
    const [videoModal, setVideoModal] = useState(null);

    const activeTab = tab === 'video' ? 'video' : 'photo';

    useEffect(() => {
        fetchData();
        setCurrentFolderId(null);
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        window.scrollTo(0, 0);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [slug, tab]);

    const fetchData = async () => {
        try {
            const res = await getPublicSchoolApi(slug);
            setSchool(res.data);
            if (res.data?.id) {
                const contentRes = await getPublicModuleContentApi(res.data.id, 'gallery');
                if (contentRes.data) setContent(contentRes.data);
            }
        } catch (e) {
            navigate('/school-not-found');
        } finally {
            setLoading(false);
        }
    };

    const tc = school ? getThemeColors(school.theme) : getThemeColors(null);
    const bc = school ? getBaseColors(school.base_theme) : getBaseColors(null);
    const navbarSolid = scrollY > 60;

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconSpinner />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!school) return null;

    if (!isModuleEnabled(school, 'gallery')) return <NotPublished tc={tc} slug={slug} label="Gallery" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Gallery" />;

    const nodesKey = activeTab === 'photo' ? 'photoNodes' : 'videoNodes';
    const nodes = content[nodesKey] || [];

    const getFolder = (id) => nodes.find(n => n.id === id);
    // Priority decides display order — 1 shows first. Folders without one (legacy data)
    // sort after all prioritized ones, in their original order.
    const childFolders = nodes
        .filter(n => n.parentId === currentFolderId)
        .sort((a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity));
    const currentFolder = currentFolderId ? getFolder(currentFolderId) : null;

    const breadcrumb = [];
    let cursor = currentFolderId;
    while (cursor) {
        const f = getFolder(cursor);
        if (!f) break;
        breadcrumb.unshift(f);
        cursor = f.parentId;
    }

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const countDescendantMedia = (folderId) => {
        let count = 0;
        const stack = [folderId];
        while (stack.length) {
            const id = stack.pop();
            const f = getFolder(id);
            if (!f) continue;
            count += activeTab === 'photo' ? (f.images || []).length : (f.videos || []).length;
            nodes.filter(n => n.parentId === id).forEach(child => stack.push(child.id));
        }
        return count;
    };

    const visibleVideos = currentFolder
        ? (currentFolder.videos || []).filter(v => (v.sourceType === 'upload' ? v.videoUrl : v.youtubeUrl))
        : [];

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes tilePop { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                body { background: ${bc.surface}; }
                @keyframes folderPop { from { opacity: 0; transform: translateY(22px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .folder-tile {
                    position: relative; border-radius: 26px; cursor: pointer; padding: 12px 12px 3px;
                    background: linear-gradient(160deg, ${tc.light}, #ffffff);
                    border: 1px solid rgba(15,23,42,0.06);
                    box-shadow: 0 2px 10px rgba(15,23,42,0.05);
                    transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease, border-color 0.4s ease;
                    animation: folderPop 0.55s cubic-bezier(0.16,1,0.3,1) both;
                }
                .folder-tile:hover { transform: translateY(-9px); box-shadow: 0 30px 55px -18px rgba(15,23,42,0.3); border-color: rgba(15,23,42,0.14); }
                .folder-cover { position: relative; height: 140px; overflow: hidden; border-radius: 18px; }
                .folder-cover::after {
                    content: ''; position: absolute; inset: 0; z-index: 3; pointer-events: none;
                    background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.45) 48%, transparent 61%);
                    transform: translateX(-140%); transition: transform 1s ease;
                }
                .folder-tile:hover .folder-cover::after { transform: translateX(140%); }
                .folder-cover img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.7s cubic-bezier(0.16,1,0.3,1); }
                .folder-tile:hover .folder-cover img { transform: scale(1.1); }
                .folder-cover-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.5) 100%); }
                .folder-badge-overlap { transition: transform 0.45s cubic-bezier(0.34,1.56,0.64,1); }
                .folder-tile:hover .folder-badge-overlap { transform: scale(1.12) rotate(-8deg); }
                .folder-count-badge { transition: transform 0.3s ease; }
                .folder-tile:hover .folder-count-badge { transform: translateY(-2px); }
                .photo-tile { position: relative; transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease; cursor: pointer; animation: tilePop 0.4s ease forwards; }
                .photo-tile:hover { transform: scale(1.035); box-shadow: 0 18px 36px -12px rgba(15,23,42,0.28); z-index: 2; }
                .photo-tile img { transition: transform 0.5s ease; }
                .photo-tile:hover img { transform: scale(1.08); }
                .photo-tile-scrim { position: absolute; inset: 0; background: rgba(15,23,42,0); transition: background 0.3s ease; display: flex; align-items: center; justify-content: center; }
                .photo-tile:hover .photo-tile-scrim { background: rgba(15,23,42,0.18); }
                .photo-tile-zoom { opacity: 0; transform: scale(0.7); transition: all 0.25s ease; }
                .photo-tile:hover .photo-tile-zoom { opacity: 1; transform: scale(1); }
                .video-row { transition: all 0.25s cubic-bezier(0.16,1,0.3,1); }
                .video-row:hover { background: #f1f5f9 !important; transform: translateX(4px); box-shadow: 0 10px 26px rgba(15,23,42,0.08); }
                .video-thumb img { transition: transform 0.5s cubic-bezier(0.16,1,0.3,1); }
                .video-row:hover .video-thumb img { transform: scale(1.08); }
                .video-play-btn { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
                .video-row:hover .video-play-btn { transform: scale(1.18); }
                .crumb-link { transition: color 0.2s; cursor: pointer; }
                .crumb-link:hover { color: ${tc.primary} !important; }
                .tab-btn { transition: all 0.2s; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
                @media (max-width: 900px) {
                    .gallery-folder-grid { grid-template-columns: repeat(2,1fr) !important; }
                    .gallery-photo-grid { grid-template-columns: repeat(3,1fr) !important; }
                }
                @media (max-width: 640px) {
                    .gallery-folder-grid { grid-template-columns: repeat(2,1fr) !important; gap: 12px !important; }
                    .gallery-photo-grid { grid-template-columns: repeat(2,1fr) !important; }
                    .gallery-video-grid { grid-template-columns: repeat(2,1fr) !important; gap: 12px !important; }
                    .lightbox-nav-btn { left: 4px !important; right: 4px !important; width: 38px !important; height: 38px !important; }

                    /* ── Folder tiles — compact 2-per-row proportions instead of the desktop-sized cover/badge ── */
                    .folder-tile { border-radius: 18px !important; padding: 8px !important; }
                    .folder-cover { height: 100px !important; border-radius: 13px !important; }
                    .folder-badge-overlap { width: 38px !important; height: 38px !important; top: -19px !important; left: 10px !important; border-radius: 11px !important; border-width: 2px !important; }
                    .folder-badge-overlap svg { width: 16px !important; height: 16px !important; }
                    .folder-count-badge { padding: 3px 8px !important; top: 8px !important; right: 8px !important; gap: 3px !important; }
                    .folder-count-badge span { font-size: 9.5px !important; }
                    .folder-count-badge svg { width: 9px !important; height: 9px !important; }
                    .folder-caption-wrap { padding-top: 20px !important; }
                    .folder-caption-text { padding-left: 46px !important; min-height: 0px !important; padding-bottom: 2px !important; }
                    .folder-caption-text p:first-child { font-size: 14.5px !important; }
                    .folder-caption-text p:last-child { font-size: 10px !important; }

                    /* ── Video tiles — the row layout (thumb-left, title-right) only works at
                       full width; in a 2-per-row grid it stacks into a compact vertical card
                       instead, thumbnail on top so it isn't squeezed to almost nothing ── */
                    .video-row { flex-direction: column !important; align-items: stretch !important; gap: 8px !important; padding: 8px !important; border-radius: 12px !important; }
                    .video-thumb { width: 100% !important; max-width: none !important; }
                    .video-info { padding-right: 0 !important; padding: 0 2px 2px !important; }
                    .video-info p { font-size: 12.5px !important; }
                }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="gallery" />

                {/* ── Header — no banner photo, clean gradient header (same design as About Us) ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'calc(92px + 1.6rem) clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-1px', marginBottom: '10px' }}>
                            {activeTab === 'photo' ? 'Photo Gallery' : 'Video Gallery'}
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* ── Breadcrumb ── */}
                <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '2.5rem clamp(1.25rem,6vw,5rem) 0' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                        background: bc.cardAlt, border: '1px solid #f1f5f9', borderRadius: '999px',
                        padding: '10px 20px',
                    }}>
                        <span className="crumb-link" onClick={() => setCurrentFolderId(null)}
                            style={{ fontSize: '13.5px', fontWeight: !currentFolderId ? 700 : 500, color: !currentFolderId ? tc.primary : '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IconHome size={13} color={!currentFolderId ? tc.primary : '#cbd5e1'} /> {activeTab === 'photo' ? 'Photo Gallery' : 'Video Gallery'}
                        </span>
                        {breadcrumb.map(f => (
                            <span key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <IconChevronRight />
                                <span className="crumb-link" onClick={() => setCurrentFolderId(f.id)}
                                    style={{ fontSize: '13.5px', fontWeight: f.id === currentFolderId ? 700 : 500, color: f.id === currentFolderId ? tc.primary : '#64748b' }}>
                                    {f.name}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── Folder grid ── */}
                <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '1.75rem clamp(1.25rem,6vw,5rem) 0' }}>
                    {childFolders.length > 0 && (
                        <div className="gallery-folder-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', marginBottom: '3rem' }}>
                            {childFolders.map((f, i) => {
                                const subCount = nodes.filter(n => n.parentId === f.id).length;
                                const mediaCount = countDescendantMedia(f.id);
                                const coverImg = f.coverImage || (activeTab === 'photo' ? f.images?.[0] : null);
                                const countLabel = subCount > 0
                                    ? `${subCount} folder${subCount > 1 ? 's' : ''}`
                                    : `${mediaCount} ${activeTab === 'photo' ? 'photo' : 'video'}${mediaCount !== 1 ? 's' : ''}`;
                                return (
                                    <div key={f.id} className="folder-tile" onClick={() => setCurrentFolderId(f.id)}
                                        style={{ animationDelay: `${i * 0.06}s` }}>
                                        <div className="folder-cover" style={{ background: coverImg ? '#000' : `linear-gradient(135deg, ${tc.light}, ${bc.surface})` }}>
                                            {coverImg ? (
                                                <>
                                                    <img src={coverImg} alt="" />
                                                    <div className="folder-cover-scrim"></div>
                                                </>
                                            ) : (
                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <IconFolder size={44} color={`${tc.primary}35`} />
                                                </div>
                                            )}
                                            <div className="folder-count-badge" style={{
                                                position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '5px',
                                                padding: '5px 12px', borderRadius: '999px',
                                                background: coverImg ? 'rgba(255,255,255,0.92)' : '#ffffff',
                                                boxShadow: '0 2px 8px rgba(15,23,42,0.1)',
                                            }}>
                                                {activeTab === 'photo'
                                                    ? <IconImage size={11} color={tc.primary} />
                                                    : <IconVideo size={11} color={tc.primary} />}
                                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>{countLabel}</span>
                                            </div>
                                        </div>

                                        {/* Caption — a literal folder "tab" badge straddles the seam between cover and text, like a wax seal */}
                                        <div className="folder-caption-wrap" style={{ position: 'relative', paddingTop: '26px' }}>
                                            <div className="folder-badge-overlap" style={{
                                                position: 'absolute', top: '-26px', left: '14px', width: '50px', height: '50px', borderRadius: '15px',
                                                background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`,
                                                boxShadow: `0 8px 20px -4px ${tc.primary}80`,
                                                border: '3px solid #ffffff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <IconFolder size={22} color="#ffffff" />
                                            </div>
                                            <div className="folder-caption-text" style={{ paddingLeft: '64px', minHeight: '0px', paddingBottom: '0px' }}>
                                                <p style={{
                                                    fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18.5px', fontWeight: 700,
                                                    color: '#0f172a', letterSpacing: '-0.1px', marginBottom: '2px', lineHeight: 1.25,
                                                    whiteSpace: 'normal', overflowWrap: 'break-word', wordBreak: 'break-word',
                                                }}>{f.name}</p>
                                                {f.createdAt && (
                                                    <p style={{ fontSize: '11.5px', color: tc.primary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.75 }}>
                                                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                                        {formatDate(f.createdAt)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Photos in current folder ── */}
                    {activeTab === 'photo' && currentFolder && (currentFolder.images || []).length > 0 && (
                        <Reveal>
                            <div style={{ marginBottom: '4rem' }}>
                                <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1.5rem' }}>Photos in this folder</p>
                                <div className="gallery-photo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
                                    {currentFolder.images.map((img, i) => (
                                        <div key={i} className="photo-tile" style={{ animationDelay: `${i * 0.03}s`, borderRadius: '12px', overflow: 'hidden', aspectRatio: '1', boxShadow: '0 4px 14px rgba(15,23,42,0.07)' }}
                                            onClick={() => setLightbox({ images: currentFolder.images, index: i })}>
                                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div className="photo-tile-scrim">
                                                <svg className="photo-tile-zoom" width="26" height="26" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                                                    <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" /><path strokeLinecap="round" d="M11 8v6M8 11h6" />
                                                </svg>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Reveal>
                    )}

                    {/* ── Videos in current folder ── */}
                    {activeTab === 'video' && currentFolder && visibleVideos.length > 0 && (
                        <Reveal>
                            <div style={{ marginBottom: '4rem' }}>
                                <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1.5rem' }}>Videos in this folder</p>
                                <div className="gallery-video-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px' }}>
                                    {visibleVideos.map(v => {
                                        const isUpload = v.sourceType === 'upload';
                                        const thumbBox = (
                                            <div className="video-thumb" style={{ position: 'relative', width: '45%', maxWidth: '190px', aspectRatio: '16/9', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: v.thumbnail ? '#000' : (isUpload ? tc.primary : '#ff0000'), boxShadow: '0 6px 18px rgba(15,23,42,0.12)' }}>
                                                {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: v.thumbnail ? 'rgba(15,23,42,0.22)' : 'transparent' }}>
                                                    <svg className="video-play-btn" width="34" height="34" fill="#ffffff" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}>
                                                        <path d="M8 5v14l11-7z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        );
                                        const info = (
                                            <div className="video-info" style={{ minWidth: 0, paddingRight: '8px' }}>
                                                <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.1px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.title || 'Untitled'}</p>
                                            </div>
                                        );
                                        return isUpload ? (
                                            <div key={v.id} className="video-row" onClick={() => setVideoModal({ url: v.videoUrl, title: v.title, thumbnail: v.thumbnail })}
                                                style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '14px', background: bc.cardAlt, border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>
                                                {thumbBox}
                                                {info}
                                            </div>
                                        ) : (
                                            <a key={v.id} href={v.youtubeUrl} target="_blank" rel="noreferrer" className="video-row"
                                                style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '14px', background: bc.cardAlt, border: '1px solid #e2e8f0', borderRadius: '8px', textDecoration: 'none' }}>
                                                {thumbBox}
                                                {info}
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        </Reveal>
                    )}

                    {/* Empty state */}
                    {childFolders.length === 0 && (
                        (activeTab === 'photo' && (!currentFolder || (currentFolder.images || []).length === 0)) ||
                        (activeTab === 'video' && (!currentFolder || visibleVideos.length === 0))
                    ) && (
                        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                            <IconEmpty />
                            <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '14px' }}>Nothing here yet</p>
                        </div>
                    )}
                </div>

                {/* ── Photo Lightbox ── */}
                {lightbox && (
                    <div onClick={() => setLightbox(null)}
                        style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', animation: 'fadeIn 0.25s ease' }}>
                        <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '85%', maxHeight: '80%' }}>
                            <img src={lightbox.images[lightbox.index]} alt="" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }} />
                            {lightbox.images.length > 1 && (
                                <>
                                    <button onClick={() => setLightbox(p => ({ ...p, index: p.index === 0 ? p.images.length - 1 : p.index - 1 }))}
                                        className="lightbox-nav-btn"
                                        style={{ position: 'absolute', left: '-70px', top: '50%', transform: 'translateY(-50%)', width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <IconChevronLeft color="#fff" />
                                    </button>
                                    <button onClick={() => setLightbox(p => ({ ...p, index: (p.index + 1) % p.images.length }))}
                                        className="lightbox-nav-btn"
                                        style={{ position: 'absolute', right: '-70px', top: '50%', transform: 'translateY(-50%)', width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <IconChevronRight size={18} color="#fff" />
                                    </button>
                                </>
                            )}
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '1.5rem' }}>{lightbox.index + 1} / {lightbox.images.length}</p>
                        <button onClick={() => setLightbox(null)}
                            style={{ position: 'absolute', top: '2rem', right: '2rem', width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconClose />
                        </button>
                    </div>
                )}

                {/* ── Uploaded Video Player Modal ── */}
                {videoModal && (
                    <div onClick={() => setVideoModal(null)}
                        style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', animation: 'fadeIn 0.25s ease' }}>
                        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '900px' }}>
                            <video src={videoModal.url} poster={videoModal.thumbnail || undefined} controls autoPlay style={{ width: '100%', maxHeight: '75vh', borderRadius: '12px', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', display: 'block' }} />
                            {videoModal.title && <p style={{ color: '#fff', fontSize: '14px', marginTop: '1rem', textAlign: 'center' }}>{videoModal.title}</p>}
                        </div>
                        <button onClick={() => setVideoModal(null)}
                            style={{ position: 'absolute', top: '2rem', right: '2rem', width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconClose />
                        </button>
                    </div>
                )}

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default GalleryPublic;