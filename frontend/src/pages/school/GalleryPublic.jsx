import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import { getThemeColors } from "../../constants/publicNav";

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
const IconPlay = ({ size = 18, color = '#ffffff' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M8 5v14l11-7z" />
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
    const navbarSolid = scrollY > 60;

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconSpinner />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!school) return null;

    if (!content) return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'system-ui, sans-serif' }}>
            <p style={{ fontSize: '18px', color: '#64748b' }}>Gallery not published yet</p>
            <button onClick={() => navigate(`/school/${slug}`)}
                style={{ padding: '12px 28px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Back to Home
            </button>
        </div>
    );

    const nodesKey = activeTab === 'photo' ? 'photoNodes' : 'videoNodes';
    const bannerKey = activeTab === 'photo' ? 'photoBanner' : 'videoBanner';
    const nodes = content[nodesKey] || [];
    const banner = content[bannerKey];

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
                body { background: #ffffff; }
                .folder-tile { transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease, border-color 0.25s; cursor: pointer; animation: tilePop 0.4s ease forwards; }
                .folder-tile:hover { transform: translateY(-5px); box-shadow: 0 16px 32px rgba(15,23,42,0.1); border-color: #f0c4c4 !important; }
                .photo-tile { transition: transform 0.25s ease, box-shadow 0.25s ease; cursor: pointer; animation: tilePop 0.4s ease forwards; }
                .photo-tile:hover { transform: scale(1.03); box-shadow: 0 14px 28px rgba(15,23,42,0.14); z-index: 2; }
                .video-row { transition: all 0.2s; }
                .video-row:hover { background: #f8fafc; transform: translateX(3px); }
                .crumb-link { transition: color 0.2s; cursor: pointer; }
                .crumb-link:hover { color: ${tc.primary} !important; }
                .tab-btn { transition: all 0.2s; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="gallery" />

                {/* ── Banner — increased height ── */}
                <div style={{ height: '70vh', position: 'relative', overflow: 'hidden' }}>
                    {banner ? (
                        <img src={banner} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${tc.dark},${tc.primary})` }}></div>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}></div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 2rem' }}>
                        <div>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '16px' }}>{school.name}</p>
                            <h1 style={{ fontSize: 'clamp(40px,6vw,72px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1, color: '#ffffff', textShadow: '0 4px 30px rgba(0,0,0,0.4)' }}>
                                {activeTab === 'photo' ? 'Photo Gallery' : 'Video Gallery'}
                            </h1>
                        </div>
                    </div>
                </div>

                {/* ── Breadcrumb ── */}
                <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '2.5rem 5rem 0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span className="crumb-link" onClick={() => setCurrentFolderId(null)}
                        style={{ fontSize: '14px', fontWeight: !currentFolderId ? 700 : 500, color: !currentFolderId ? tc.primary : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconHome size={13} color={!currentFolderId ? tc.primary : '#cbd5e1'} /> {activeTab === 'photo' ? 'Photo Gallery' : 'Video Gallery'}
                    </span>
                    {breadcrumb.map(f => (
                        <span key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <IconChevronRight />
                            <span className="crumb-link" onClick={() => setCurrentFolderId(f.id)}
                                style={{ fontSize: '14px', fontWeight: f.id === currentFolderId ? 700 : 500, color: f.id === currentFolderId ? tc.primary : '#94a3b8' }}>
                                {f.name}
                            </span>
                        </span>
                    ))}
                </div>

                {/* ── Folder grid ── */}
                <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '1.75rem 5rem 0' }}>
                    {childFolders.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '18px', marginBottom: '3rem' }}>
                            {childFolders.map((f, i) => {
                                const subCount = nodes.filter(n => n.parentId === f.id).length;
                                const mediaCount = countDescendantMedia(f.id);
                                const coverImg = f.coverImage || (activeTab === 'photo' ? f.images?.[0] : null);
                                return (
                                    <div key={f.id} className="folder-tile" onClick={() => setCurrentFolderId(f.id)}
                                        style={{ animationDelay: `${i * 0.04}s`, borderRadius: '16px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 2px 10px rgba(15,23,42,0.04)', background: '#ffffff' }}>
                                        <div style={{ height: '140px', background: tc.light, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                            {coverImg ? (
                                                <>
                                                    <img src={coverImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.35))' }}></div>
                                                </>
                                            ) : null}
                                            <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '32px', height: '32px', borderRadius: '8px', background: coverImg ? 'rgba(255,255,255,0.92)' : tc.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <IconFolder size={18} color={tc.primary} />
                                            </div>
                                        </div>
                                        <div style={{ padding: '0.9rem 1rem' }}>
                                            <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</p>
                                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                {subCount > 0 ? `${subCount} folder${subCount > 1 ? 's' : ''}` : `${mediaCount} ${activeTab === 'photo' ? 'photo' : 'video'}${mediaCount !== 1 ? 's' : ''}`}
                                            </p>
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
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
                                    {currentFolder.images.map((img, i) => (
                                        <div key={i} className="photo-tile" style={{ animationDelay: `${i * 0.03}s`, borderRadius: '12px', overflow: 'hidden', aspectRatio: '1', boxShadow: '0 4px 14px rgba(15,23,42,0.07)' }}
                                            onClick={() => setLightbox({ images: currentFolder.images, index: i })}>
                                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '14px' }}>
                                    {visibleVideos.map(v => {
                                        const isUpload = v.sourceType === 'upload';
                                        return isUpload ? (
                                            <div key={v.id} className="video-row" onClick={() => setVideoModal({ url: v.videoUrl, title: v.title })}
                                                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', background: '#f8fafc', borderRadius: '12px', cursor: 'pointer' }}>
                                                <div style={{ width: '42px', height: '42px', background: tc.primary, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <IconPlay size={18} />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{v.title || 'Untitled'}</p>
                                                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>{formatDate(v.date)}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <a key={v.id} href={v.youtubeUrl} target="_blank" rel="noreferrer" className="video-row"
                                                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', background: '#f8fafc', borderRadius: '12px', textDecoration: 'none' }}>
                                                <div style={{ width: '42px', height: '42px', background: '#ff0000', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <IconPlay size={18} />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{v.title || 'Untitled'}</p>
                                                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>{formatDate(v.date)}</p>
                                                </div>
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
                                        style={{ position: 'absolute', left: '-70px', top: '50%', transform: 'translateY(-50%)', width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <IconChevronLeft color="#fff" />
                                    </button>
                                    <button onClick={() => setLightbox(p => ({ ...p, index: (p.index + 1) % p.images.length }))}
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
                            <video src={videoModal.url} controls autoPlay style={{ width: '100%', maxHeight: '75vh', borderRadius: '12px', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', display: 'block' }} />
                            {videoModal.title && <p style={{ color: '#fff', fontSize: '14px', marginTop: '1rem', textAlign: 'center' }}>{videoModal.title}</p>}
                        </div>
                        <button onClick={() => setVideoModal(null)}
                            style={{ position: 'absolute', top: '2rem', right: '2rem', width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconClose />
                        </button>
                    </div>
                )}

                {/* ── Footer CTA ── */}
                <div style={{ padding: '5rem', background: tc.light, textAlign: 'center', marginTop: '3rem' }}>
                    <button onClick={() => navigate(`/school/${slug}`)}
                        style={{ padding: '14px 36px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: `0 10px 30px ${tc.primary}30`, letterSpacing: '0.05em' }}>
                        Back to Home
                    </button>
                </div>

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default GalleryPublic;