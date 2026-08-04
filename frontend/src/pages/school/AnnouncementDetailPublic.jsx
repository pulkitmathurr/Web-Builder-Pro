import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { TAG_COLORS } from "./AnnouncementsPublic";
import { formatDate, formatTime, readingTime } from "../../utils/dateTimeFormat";
import { normalizeImages, getImageUrl, getImageOrientation } from "../../utils/imageOrientation";

const ChevronLeftIcon = ({ color, size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
    </svg>
);

const ChevronRightIcon = ({ color, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
    </svg>
);

const CloseIcon = ({ color = '#fff', size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);

const hexToRgba = (hex, alpha) => {
    const h = (hex || '#8b2252').replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

// ── A single mosaic tile's photo. Horizontal photos fill the tile edge-to-edge
// (object-fit: cover) exactly as before. Vertical photos are never force-cropped into a
// landscape box — they sit uncropped (object-fit: contain) over a softly blurred fill of
// the same photo, so there's no empty letterbox bars, just a professional framed look. ──
const MosaicPhoto = ({ src, orientation }) => (
    orientation === 'vertical' ? (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0f172a' }}>
            <img src={src} alt="" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(22px) brightness(0.65)', transform: 'scale(1.15)' }} />
            <img src={src} alt="" style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        </div>
    ) : (
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    )
);

// ── Image mosaic — up to 5 images: one large photo on the left (with forward/backward
// navigation) and up to two stacked smaller photos on the right that rotate along with it.
// If more images exist than fit, the last visible tile gets a "+N View More" overlay;
// clicking any tile opens the full lightbox. Same pattern as the Events module. Each photo
// carries its own horizontal/vertical orientation (set by the admin) — see MosaicPhoto. ──
const ImageMosaic = ({ images, onOpen, tc }) => {
    const [mainIdx, setMainIdx] = useState(0);
    if (!images.length) return null;
    const n = images.length;

    const prevMain = (e) => { e.stopPropagation(); setMainIdx(p => (p === 0 ? n - 1 : p - 1)); };
    const nextMain = (e) => { e.stopPropagation(); setMainIdx(p => (p + 1) % n); };

    // ── Theme-colored gradient border (instead of a flat grey line) — the frame is padded,
    // painted white on the inside and with the school's primary→secondary gradient on the
    // outside, so every school's photos get a border that matches their own site colors. ──
    const frameStyle = {
        background: `linear-gradient(#ffffff,#ffffff) padding-box, linear-gradient(135deg, ${tc.primary}, ${tc.secondary}) border-box`,
        border: '2px solid transparent',
        boxShadow: `0 16px 36px ${hexToRgba(tc.primary, 0.22)}, 0 4px 10px rgba(15,23,42,0.08)`,
    };

    if (n === 1) {
        const isVertical = getImageOrientation(images[0]) === 'vertical';
        return (
            <div className="mosaic-frame-in" style={{ maxWidth: isVertical ? '420px' : 'none', margin: isVertical ? '0 auto' : 0 }}>
                <div style={{ ...frameStyle, padding: '7px', borderRadius: '20px' }}>
                    <div className="mosaic-tile" style={{ height: isVertical ? undefined : '380px', aspectRatio: isVertical ? '3 / 4' : undefined, borderRadius: '15px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => onOpen(0)}>
                        <MosaicPhoto src={getImageUrl(images[0])} orientation={getImageOrientation(images[0])} />
                    </div>
                </div>
            </div>
        );
    }

    const smallIdxs = [];
    for (let i = 1; i <= 2 && i < n; i++) smallIdxs.push((mainIdx + i) % n);
    const hiddenCount = Math.max(0, n - 1 - smallIdxs.length);

    return (
        <div style={{ display: 'flex', gap: '12px', height: '380px' }}>
            <div style={{ ...frameStyle, flex: '0 0 63%', padding: '6px', borderRadius: '18px' }}>
                <div className="mosaic-tile" style={{ position: 'relative', height: '100%', borderRadius: '13px', overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => onOpen(mainIdx)}>
                    <MosaicPhoto src={getImageUrl(images[mainIdx])} orientation={getImageOrientation(images[mainIdx])} />
                    <button onClick={prevMain}
                        style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeftIcon color="#fff" size={16} />
                    </button>
                    <button onClick={nextMain}
                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronRightIcon color="#fff" />
                    </button>
                    <span style={{ position: 'absolute', bottom: '14px', right: '16px', fontSize: '11px', fontWeight: 700, color: '#fff', background: 'rgba(15,23,42,0.55)', padding: '4px 10px', borderRadius: '999px' }}>
                        {mainIdx + 1} / {n}
                    </span>
                </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {smallIdxs.map((imgIdx, i) => {
                    const isLast = i === smallIdxs.length - 1;
                    const showOverlay = isLast && hiddenCount > 0;
                    return (
                        <div key={imgIdx} style={{ ...frameStyle, flex: 1, padding: '5px', borderRadius: '14px' }}>
                            <div className="mosaic-tile" style={{ position: 'relative', height: '100%', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer' }}
                                onClick={() => onOpen(imgIdx)}>
                                <MosaicPhoto src={getImageUrl(images[imgIdx])} orientation={getImageOrientation(images[imgIdx])} />
                                {showOverlay && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.62)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                        <span style={{ color: '#fff', fontWeight: 800, fontSize: '19px', lineHeight: 1 }}>+{hiddenCount}</span>
                                        <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.03em' }}>View More</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const AnnouncementDetailPublic = () => {
    const { slug, id } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const [lightbox, setLightbox] = useState(null);

    useEffect(() => {
        fetchData();
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [slug, id]);

    const fetchData = async () => {
        try {
            const res = await getPublicSchoolApi(slug);
            setSchool(res.data);
            if (res.data?.id) {
                const contentRes = await getPublicModuleContentApi(res.data.id, 'announcements');
                if (contentRes.data) setContent(contentRes.data);
            }
        } catch (e) {
            navigate('/school-not-found');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid #f0c4c4', borderTop: '3px solid #8b2252', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!school) return null;

    const tc = getThemeColors(school.theme);
    const bc = getBaseColors(school.base_theme);

    if (!isModuleEnabled(school, 'announcements')) return <NotPublished tc={tc} slug={slug} label="Announcements" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Announcements" />;

    const announcement = (content.announcements || []).find(a => String(a.id) === String(id));

    if (!announcement) {
        return (
            <>
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="announcements" />
                <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '4rem 2rem' }}>
                    <p style={{ fontSize: '15px', color: '#94a3b8' }}>This announcement could not be found.</p>
                    <Link to={`/school/${slug}/announcements`} style={{ fontSize: '13.5px', fontWeight: 600, color: tc.primary, textDecoration: 'none' }}>← Back to Announcements</Link>
                </div>
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </>
        );
    }

    const { day, month, year } = formatDate(announcement.date);
    const time = formatTime(announcement.time);
    const tagColor = TAG_COLORS[announcement.tag] || tc.primary;
    const mins = readingTime(announcement.body);
    const images = normalizeImages(announcement.images && announcement.images.length ? announcement.images : (announcement.image ? [announcement.image] : []));

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                body { background: ${bc.surface}; }
                .rte-content p { margin-bottom: 0.95em; }
                .rte-content p:last-child { margin-bottom: 0; }
                .rte-content strong { font-weight: 700; color: #0f172a; }
                .rte-content em { font-style: italic; }
                .rte-content u { text-decoration: underline; }
                .rte-content ul, .rte-content ol { padding-left: 1.4em; margin-bottom: 0.9em; }
                .rte-content li { margin-bottom: 0.35em; }
                .rte-content .ql-size-small { font-size: 0.8em; }
                .rte-content .ql-size-large { font-size: 1.35em; }
                .rte-content .ql-size-huge { font-size: 2em; }
                .rte-content .ql-font-inter { font-family: 'Inter', system-ui, sans-serif; }
                .rte-content .ql-font-poppins { font-family: 'Poppins', sans-serif; }
                .rte-content .ql-font-montserrat { font-family: 'Montserrat', sans-serif; }
                .rte-content .ql-font-playfair { font-family: 'Playfair Display', Georgia, serif; }
                .rte-content .ql-font-raleway { font-family: 'Raleway', sans-serif; }
                .rte-content .ql-font-merriweather { font-family: 'Merriweather', Georgia, serif; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
                .mosaic-tile img { transition: transform 0.4s ease; }
                .mosaic-tile:hover img { transform: scale(1.05); }
                @keyframes mosaicFrameIn { from { opacity: 0; transform: translateY(18px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .mosaic-frame-in { animation: mosaicFrameIn 0.65s cubic-bezier(0.16,1,0.3,1) both; }
                .mosaic-frame-in > div { transition: box-shadow 0.35s ease, transform 0.35s ease; }
                .mosaic-frame-in:hover > div { transform: translateY(-4px); box-shadow: 0 22px 46px ${hexToRgba(tc.primary, 0.3)}, 0 6px 14px rgba(15,23,42,0.1); }
                @media (max-width: 640px) {
                    .lightbox-nav-btn { left: 4px !important; right: 4px !important; width: 36px !important; height: 36px !important; }
                }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar — always solid on this page since there's no dark hero for a transparent navbar to sit on ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="announcements" forceSolid />

                {/* ── Article — no boxed card, content flows directly on the page background ── */}
                <div style={{ padding: 'calc(92px + 1.1rem) clamp(1.25rem,6vw,3rem) 3rem' }}>
                    <div style={{ maxWidth: '960px', margin: '0 auto' }}>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                            <span style={{
                                fontSize: '10px', fontWeight: 700, color: tagColor, background: `${tagColor}14`,
                                padding: '4px 11px', borderRadius: '999px', letterSpacing: '0.05em', textTransform: 'uppercase',
                            }}>
                                {announcement.tag || 'General'}
                            </span>
                            {announcement.pinned && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: tc.primary }}>📌 Pinned Notice</span>
                            )}
                        </div>

                        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px,3.8vw,38px)', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1.22, marginBottom: '0.85rem' }}>
                            {announcement.title}
                        </h1>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#94a3b8', fontWeight: 500, marginBottom: '1.5rem', flexWrap: 'wrap', paddingBottom: '1.25rem', borderBottom: '1px solid #eef1f6' }}>
                            <span>{month} {day}, {year}</span>
                            {time && (
                                <>
                                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                                    <span>{time}</span>
                                </>
                            )}
                            {mins && (
                                <>
                                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                                    <span>{mins} min read</span>
                                </>
                            )}
                        </div>

                        {announcement.body && (
                            <div className="rte-content" style={{ fontSize: '15.5px', color: '#334155', lineHeight: 1.9, marginBottom: images.length ? '2rem' : 0 }}
                                dangerouslySetInnerHTML={{ __html: announcement.body }} />
                        )}

                        {images.length > 0 && (
                            <ImageMosaic images={images} tc={tc} onOpen={(i) => setLightbox({ images, index: i })} />
                        )}
                    </div>
                </div>

                {/* ── Image lightbox ── */}
                {lightbox && (
                    <div onClick={() => setLightbox(null)}
                        style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', animation: 'fadeIn 0.2s ease' }}>
                        <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '85%', maxHeight: '80%' }}>
                            <img src={getImageUrl(lightbox.images[lightbox.index])} alt="" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }} />
                            {lightbox.images.length > 1 && (
                                <>
                                    <button onClick={() => setLightbox(p => ({ ...p, index: p.index === 0 ? p.images.length - 1 : p.index - 1 }))}
                                        className="lightbox-nav-btn"
                                        style={{ position: 'absolute', left: '-64px', top: '50%', transform: 'translateY(-50%)', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ChevronLeftIcon color="#fff" size={16} />
                                    </button>
                                    <button onClick={() => setLightbox(p => ({ ...p, index: (p.index + 1) % p.images.length }))}
                                        className="lightbox-nav-btn"
                                        style={{ position: 'absolute', right: '-64px', top: '50%', transform: 'translateY(-50%)', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ChevronRightIcon color="#fff" />
                                    </button>
                                </>
                            )}
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '1.5rem' }}>{lightbox.index + 1} / {lightbox.images.length}</p>
                        <button onClick={() => setLightbox(null)}
                            style={{ position: 'absolute', top: '2rem', right: '2rem', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CloseIcon />
                        </button>
                    </div>
                )}

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default AnnouncementDetailPublic;
