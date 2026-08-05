import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { getFontFamily } from "../../constants/fonts";
import { COLLAGE_LAYOUTS, DEFAULT_COLLAGE_LAYOUT } from "../../utils/sportsCollage";

const PAGES = [
    { key: 'sportsAt', label: 'Sports at School' },
    { key: 'sportsOffered', label: 'Sports Offered' },
    { key: 'sportingEvents', label: 'Sporting Events' },
    { key: 'awards', label: 'Sports Awards & Achievements' },
];

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
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)', transition: `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>
            {children}
        </div>
    );
};

// ── Reusable lightbox — click any image (or cert) to view it big ──
const ImageLightbox = ({ data, onClose, tc }) => {
    if (!data) return null;
    return (
        <div onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', animation: 'fadeIn 0.25s ease' }}>
            <div onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={data.image} alt=""
                    style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }} />
                {(data.title || data.info) && (
                    <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.75rem', marginTop: '1.25rem', maxWidth: '520px', textAlign: 'center' }}>
                        {data.title && <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: data.info ? '6px' : 0 }}>{data.title}</p>}
                        {data.info && <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6 }}>{data.info}</p>}
                    </div>
                )}
            </div>
            <button onClick={onClose}
                style={{ position: 'absolute', top: '2rem', right: '2rem', width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
    );
};

// ── Masonry gallery for "Sports at School" page — 7-photo hero block + simple grid for the rest ──
const SportsAtGallery = ({ images, layout, tc, onImageClick }) => {
    if (!images || images.length === 0) return null;

    const layoutDef = COLLAGE_LAYOUTS[layout] || COLLAGE_LAYOUTS[DEFAULT_COLLAGE_LAYOUT];
    const slots = layoutDef.slots;
    const heroImages = images.slice(0, slots.length);
    // Overflow photos only ever show for the full 7-photo layout — the 4 and 5 layouts
    // stay a clean, fixed-size collage even if extra photos exist from a previous layout.
    const restImages = layout === '7' ? images.slice(slots.length).filter(Boolean) : [];

    return (
        <div style={{ width: '100%' }}>
            <div className="sports-collage-grid" style={{
                display: 'grid', gridTemplateColumns: `repeat(${layoutDef.cols}, 1fr)`,
                ...(layoutDef.square ? {} : { gridTemplateRows: `repeat(${layoutDef.rows}, var(--collage-rh, ${layoutDef.rowHeight}px))`, '--collage-rh': `${layoutDef.rowHeight}px` }),
                gap: '14px', width: '100%'
            }}>
                {heroImages.map((img, i) => img && (
                    <div key={i} onClick={() => onImageClick(img)}
                        style={{ ...(layoutDef.square ? { aspectRatio: '1' } : slots[i]), borderRadius: '18px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', cursor: 'zoom-in' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                ))}
            </div>

            {restImages.length > 0 && (
                <div className="sports-rest-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginTop: '14px' }}>
                    {restImages.map((img, i) => (
                        <div key={i} onClick={() => onImageClick(img)} style={{ height: '160px', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', cursor: 'zoom-in' }}>
                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Single-image slider — one image at a time with prev/next, floated beside the
// description text inside EventStyleCard's single bounded block. ──
const SingleImageSlider = ({ images, tc, onImageClick }) => {
    const [idx, setIdx] = useState(0);
    if (!images || images.length === 0) return null;
    const prev = () => setIdx(p => (p === 0 ? images.length - 1 : p - 1));
    const next = () => setIdx(p => (p + 1) % images.length);

    return (
        <div>
            <div className="sport-frame">
                <div className="sport-frame-inner" style={{ aspectRatio: '4/5' }}>
                    <img key={idx} src={images[idx]} alt="" onClick={() => onImageClick(images[idx])}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'zoom-in', animation: 'fadeIn 0.3s ease' }} />
                    <div className="sport-frame-stripe"></div>
                    {images.length > 1 && (
                        <>
                            <button className="sport-nav-btn" onClick={prev}
                                style={{ position: 'absolute', left: '6px', top: '50%' }}>
                                <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                            </button>
                            <button className="sport-nav-btn" onClick={next}
                                style={{ position: 'absolute', right: '6px', top: '50%' }}>
                                <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                            </button>
                            <div style={{ position: 'absolute', bottom: '15px', right: '14px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '12px', fontWeight: 600, backdropFilter: 'blur(8px)', zIndex: 2 }}>
                                {idx + 1} / {images.length}
                            </div>
                        </>
                    )}
                </div>
            </div>
            {images.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', justifyContent: 'center' }}>
                    {images.map((_, i) => (
                        <div key={i} onClick={() => setIdx(i)}
                            style={{ width: i === idx ? '22px' : '8px', height: '8px', borderRadius: '4px', background: i === idx ? tc.primary : '#e2e8f0', cursor: 'pointer', transition: 'all 0.25s' }}></div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Reusable "event style" card — image floats inside the same bounded block as the
// description (same technique as the About page's History section), so both live in
// ONE contained box and the text never spills outside it. ──
const EventStyleCard = ({ heading, description, images, tc, bc, onImageClick }) => {
    const words = (heading || '').trim().split(' ');
    const lastWord = words.pop();
    const restText = words.join(' ');
    const hasImages = images?.length > 0;

    return (
        <div className="event-style-card" style={{ background: bc.card, border: '1px solid #f1f5f9', borderRadius: '20px', padding: '2rem', boxShadow: '0 6px 20px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
            <div className="event-card-kicker" style={{ width: '28px', height: '3px', background: tc.primary, borderRadius: '2px' }}></div>
            {hasImages && (
                <div className="sports-float-img" style={{ float: 'right', width: '340px', marginLeft: '2rem', marginBottom: '1rem' }}>
                    <SingleImageSlider images={images} tc={tc} onImageClick={onImageClick} />
                </div>
            )}
            <h3 className="event-card-heading" style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 'clamp(22px,2.8vw,28px)', fontWeight: 800, letterSpacing: '-0.5px',
                lineHeight: 1.25, marginBottom: '0.9rem', color: '#0f172a', textAlign: 'left'
            }}>
                {restText ? `${restText} ` : ''}<span style={{ color: tc.primary }}>{lastWord}</span>
            </h3>
            {description && (
                <div className="rte-content event-card-desc" style={{ fontSize: '14.5px', color: '#64748b', lineHeight: 1.8, textAlign: 'left' }}
                    dangerouslySetInnerHTML={{ __html: description }} />
            )}
            <div style={{ clear: 'both' }}></div>
        </div>
    );
};

// ── Carousel for event images ──
const EventImageCarousel = ({ images, tc }) => {
    const [idx, setIdx] = useState(0);
    if (!images || images.length === 0) return null;
    return (
        <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.1)', height: '420px', marginTop: '1.5rem' }}>
            {images.map((img, i) => (
                <img key={i} src={img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === idx ? 1 : 0, transition: 'opacity 0.6s ease' }} />
            ))}
            {images.length > 1 && (
                <>
                    <button onClick={() => setIdx(p => p === 0 ? images.length - 1 : p - 1)}
                        style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <button onClick={() => setIdx(p => (p + 1) % images.length)}
                        style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </button>
                    <div style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
                        {images.map((_, i) => (
                            <div key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? '20px' : '7px', height: '7px', borderRadius: '4px', background: i === idx ? '#ffffff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.3s' }}></div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// ── Carousel for awards page photo gallery — sober, premium hero banner ──
const PhotoCarousel = ({ images, tc }) => {
    const [idx, setIdx] = useState(0);
    if (!images || images.length === 0) return null;
    return (
        <div className="awards-carousel">
            {images.map((img, i) => (
                <img key={i} src={img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === idx ? 1 : 0, transition: 'opacity 1s ease' }} />
            ))}
            <div className="awards-carousel-scrim"></div>
            {images.length > 1 && (
                <>
                    <button className="sport-nav-btn" onClick={() => setIdx(p => p === 0 ? images.length - 1 : p - 1)}
                        style={{ position: 'absolute', left: '18px', top: '50%' }}>
                        <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <button className="sport-nav-btn" onClick={() => setIdx(p => (p + 1) % images.length)}
                        style={{ position: 'absolute', right: '18px', top: '50%' }}>
                        <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </button>
                    <div style={{ position: 'absolute', bottom: '22px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 2 }}>
                        {images.map((_, i) => (
                            <div key={i} className="awards-dot" onClick={() => setIdx(i)}
                                style={{
                                    width: i === idx ? '28px' : '6px', height: '6px', borderRadius: '3px',
                                    background: i === idx ? `linear-gradient(90deg, ${tc.primary}, ${tc.secondary})` : 'rgba(255,255,255,0.45)',
                                    boxShadow: i === idx ? `0 0 14px ${tc.primary}80` : 'none',
                                }}></div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const SportsPublic = () => {
    const { slug, pageSlug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const [pdfPreview, setPdfPreview] = useState(null);
    const [lightbox, setLightbox] = useState(null);

    const activePageKey = pageSlug || 'sportsAt';

    useEffect(() => {
        fetchData();
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        window.scrollTo(0, 0);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [slug, pageSlug]);

    const fetchData = async () => {
        try {
            const res = await getPublicSchoolApi(slug);
            setSchool(res.data);
            if (res.data?.id) {
                const contentRes = await getPublicModuleContentApi(res.data.id, 'sports');
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
    const navbarSolid = scrollY > 60;

    if (!isModuleEnabled(school, 'sports')) return <NotPublished tc={tc} slug={slug} label="Sports" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Sports" />;

    const pageData = content[activePageKey];
    if (!pageData) return null;

    const certifications = (pageData.certifications || []).filter(c => c.image || c.title);
    const proud = (pageData.proud || []).filter(p => p.photo || p.name);
    const yearlyAwards = (pageData.yearlyAwards || []).filter(y => y.year && y.pdfUrl);
    const events = pageData.events || [];

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700;1,800&display=swap" rel="stylesheet" />
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes imgTickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                body { background: ${bc.surface}; }
                .premium-heading {
                    font-family: 'Playfair Display', Georgia, serif;
                    font-style: italic;
                    font-weight: 700;
                }
                .img-ticker-track { display: flex; width: max-content; animation: imgTickerScroll 30s linear infinite; }
                .img-ticker-track:hover { animation-play-state: paused; }
                .sport-frame {
                    position: relative; border-radius: 20px; overflow: hidden; background: #0f172a;
                    box-shadow: 0 22px 46px rgba(15,23,42,0.18), inset 0 0 0 1px rgba(255,255,255,0.08);
                    transition: transform 0.45s cubic-bezier(0.16,1,0.3,1), box-shadow 0.45s ease;
                }
                .sport-frame:hover { transform: translateY(-6px); box-shadow: 0 32px 64px rgba(15,23,42,0.26), inset 0 0 0 1px rgba(255,255,255,0.16); }
                .sport-frame-inner { position: relative; width: 100%; height: 100%; }
                .sport-frame-inner img { transition: transform 0.7s cubic-bezier(0.16,1,0.3,1); }
                .sport-frame:hover .sport-frame-inner img { transform: scale(1.07); }
                .sport-frame-stripe { position: absolute; left: 0; right: 0; bottom: 0; height: 5px; z-index: 2; background: linear-gradient(90deg, ${tc.primary}, ${tc.secondary}); }
                .sport-nav-btn { background: none; border: none; padding: 8px; cursor: pointer; color: #fff; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.65)); transition: transform 0.2s ease, opacity 0.2s ease; opacity: 0.85; transform: translateY(-50%); }
                .sport-nav-btn:hover { opacity: 1; transform: translateY(-50%) scale(1.18); }

                /* ── Awards page hero carousel ── */
                .awards-carousel { position: relative; border-radius: 22px; overflow: hidden; height: 520px; background: #0f172a;
                    box-shadow: 0 34px 70px -22px rgba(15,23,42,0.4), inset 0 0 0 1px rgba(255,255,255,0.07); }
                .awards-carousel-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%); pointer-events: none; }
                .awards-dot { transition: all 0.3s ease; cursor: pointer; }
                .sidebar-link { transition: all 0.2s; }

                /* ── Certification cards — sharp, sober, premium ── */
                .cert-card {
                    position: relative; border-radius: 16px; overflow: hidden; background: #ffffff;
                    border: 1px solid rgba(15,23,42,0.08);
                    box-shadow: 0 1px 2px rgba(15,23,42,0.04);
                    transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease, border-color 0.4s ease;
                }
                .cert-card:hover { transform: translateY(-8px); box-shadow: 0 30px 55px -22px rgba(15,23,42,0.32); border-color: rgba(15,23,42,0.14); }
                .cert-card-photo { position: relative; height: 172px; overflow: hidden; background: linear-gradient(135deg,#eef1f5,#e2e7ed); }
                .cert-card-photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.7s cubic-bezier(0.16,1,0.3,1); }
                .cert-card:hover .cert-card-photo img { transform: scale(1.08); }
                .cert-card-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15,23,42,0) 55%, rgba(15,23,42,0.32) 100%); }
                .cert-card-seal {
                    position: absolute; top: 12px; right: 12px; width: 34px; height: 34px; border-radius: 50%;
                    background: rgba(255,255,255,0.92); backdrop-filter: blur(6px);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 4px 12px rgba(15,23,42,0.18);
                }

                /* ── Making Us Proud cards — dark editorial "player card" ── */
                .proud-card {
                    position: relative; border-radius: 18px; overflow: hidden; background: #0f172a;
                    box-shadow: 0 1px 3px rgba(15,23,42,0.08);
                    transition: transform 0.45s cubic-bezier(0.16,1,0.3,1), box-shadow 0.45s ease;
                }
                .proud-card:hover { transform: translateY(-8px); box-shadow: 0 34px 65px -20px rgba(15,23,42,0.4); }
                .proud-card-photo { position: relative; height: 340px; overflow: hidden; background: #1c2536; }
                .proud-card-photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.7s cubic-bezier(0.16,1,0.3,1); }
                .proud-card:hover .proud-card-photo img { transform: scale(1.06); }
                .proud-card-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8,11,18,0) 28%, rgba(8,11,18,0.55) 55%, rgba(5,7,12,0.97) 100%); }

                .year-badge { transition: background 0.2s; cursor: pointer; }
                .year-badge:hover { background: ${tc.light} !important; }
                .event-card-kicker { display: none; }
                .rte-content { overflow-wrap: normal; word-break: normal; }
                .rte-content p { margin-bottom: 0.6em; }
                .rte-content p:last-child { margin-bottom: 0; }
                .rte-content strong { font-weight: 700; }
                .rte-content em { font-style: italic; }
                .rte-content u { text-decoration: underline; }
                .rte-content .ql-size-small { font-size: 0.75em; }
                .rte-content .ql-size-large { font-size: 1.5em; }
                .rte-content .ql-size-huge { font-size: 2.5em; }
                .rte-content .ql-font-inter { font-family: 'Inter', system-ui, sans-serif; }
                .rte-content .ql-font-poppins { font-family: 'Poppins', sans-serif; }
                .rte-content .ql-font-montserrat { font-family: 'Montserrat', sans-serif; }
                .rte-content .ql-font-playfair { font-family: 'Playfair Display', Georgia, serif; }
                .rte-content .ql-font-raleway { font-family: 'Raleway', sans-serif; }
                .rte-content .ql-font-merriweather { font-family: 'Merriweather', Georgia, serif; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
                @media (max-width: 900px) {
                    .sports-3col-grid { grid-template-columns: repeat(2,1fr) !important; }
                    .sports-cert-grid { grid-template-columns: repeat(2,1fr) !important; }
                }
                @media (max-width: 780px) {
                    .sports-float-img { float: none !important; width: 100% !important; max-width: 360px; margin: 0 auto 1.5rem !important; }

                    /* ── Sports Offered / Sporting Events cards — the boxed white card only
                       makes sense at desktop widths; on mobile it becomes a minimal editorial
                       block (no fill/border/shadow, just a hairline rule below), reordered so
                       the header and description always read before the image ── */
                    .event-style-card {
                        background: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        padding: 0 0 2.25rem !important;
                        box-shadow: none !important;
                        border-bottom: 1px solid rgba(15,23,42,0.08) !important;
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    .event-card-kicker { display: block !important; order: 1 !important; margin-bottom: 12px !important; }
                    .event-card-heading { order: 2 !important; }
                    .event-card-desc { order: 3 !important; margin-bottom: 0 !important; }
                    .sports-float-img { order: 4 !important; margin-top: 0.5rem !important; }

                    .sports-list-col { gap: 2.25rem !important; }
                }
                @media (max-width: 640px) {
                    .sports-3col-grid { grid-template-columns: 1fr !important; }
                    .sports-rest-grid { grid-template-columns: repeat(2,1fr) !important; }
                    .sports-collage-grid { --collage-rh: 130px !important; }
                    .awards-carousel { height: 320px !important; }

                    /* ── Certifications — 2-per-row compact cards instead of stacking 1-per-row ── */
                    .sports-cert-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
                    .cert-card { border-radius: 12px !important; }
                    .cert-card-photo { height: auto !important; aspect-ratio: 4/3 !important; }
                    .cert-card-seal { width: 24px !important; height: 24px !important; top: 8px !important; right: 8px !important; }
                    .cert-card-seal svg { width: 11px !important; height: 11px !important; }
                    .cert-card-body { padding: 0.8rem 0.85rem 0.95rem !important; }
                    .cert-card-eyebrow { font-size: 8.5px !important; margin-bottom: 4px !important; }
                    .cert-card-title { font-size: 12.5px !important; line-height: 1.3 !important; }
                    .cert-card-info { font-size: 10.5px !important; line-height: 1.4 !important; }
                }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="sports" />

                {/* ── Header — no banner photo, clean gradient header (same design as About Us) ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: '4.5rem clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: pageData.headingFont ? getFontFamily(pageData.headingFont) : "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: pageData.headingColor || '#ffffff', letterSpacing: '-1px', marginBottom: '10px', fontStyle: pageData.headingItalic ? 'italic' : 'normal' }}>
                            {pageData.heading || PAGES.find(p => p.key === activePageKey)?.label}
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* ── Body — single centered column, wider to reduce excess side margins ── */}
<div style={{ padding: '5rem clamp(1.25rem,5vw,2.5rem) 7rem', background: bc.surface, width: '100%', boxSizing: 'border-box' }}>
    <div style={{ maxWidth: '1140px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

                        {/* Main content */}
                        <div>
                            <Reveal style={{ textAlign: 'left' }}>
                                {pageData.heading && pageData.heading.trim() && (() => {
                                    const headingText = pageData.heading;
                                    const words = headingText.trim().split(' ');
                                    const lastWord = words.pop();
                                    const restText = words.join(' ');
                                    return (
                                        <h2 style={{
                                            fontFamily: pageData.headingFont ? getFontFamily(pageData.headingFont) : "'Inter', system-ui, sans-serif",
                                            fontSize: 'clamp(28px,3.5vw,38px)', fontWeight: 800, letterSpacing: '-0.5px',
                                            lineHeight: 1.2, marginBottom: '1.1rem', color: pageData.headingColor || '#0f172a',
                                            fontStyle: pageData.headingItalic ? 'italic' : 'normal',
                                        }}>
                                            {restText ? `${restText} ` : ''}<span style={{ color: tc.primary }}>{lastWord}</span>
                                        </h2>
                                    );
                                })()}
                                {pageData.description && (
                                    <div className="rte-content" style={{
                                        fontSize: '15px', color: '#475569', lineHeight: 1.85, marginBottom: '2rem',
                                        textAlign: 'left'
                                    }}
                                        dangerouslySetInnerHTML={{ __html: pageData.description }} />
                                )}
                            </Reveal>

                            {/* Sports at School — masonry gallery */}
                            {activePageKey === 'sportsAt' && (
                                <Reveal delay={0.1}>
                                    <SportsAtGallery
                                        images={pageData.images}
                                        layout={pageData.collageLayout || DEFAULT_COLLAGE_LAYOUT}
                                        tc={tc}
                                        onImageClick={(img) => setLightbox({ image: img })}
                                    />
                                </Reveal>
                            )}

                            {/* Sports Offered — same list pattern as Sporting Events, using the same EventStyleCard */}
                            {activePageKey === 'sportsOffered' && (
                                <div className="sports-list-col" style={{ display: 'flex', flexDirection: 'column', gap: '4rem', marginTop: '1rem' }}>
                                    {(pageData.offeredSports || []).map((sp, i) => (
                                        <Reveal key={sp.id} delay={i * 0.1}>
                                            <EventStyleCard
                                                heading={sp.heading}
                                                description={sp.description}
                                                images={sp.images}
                                                tc={tc}
                                                bc={bc}
                                                onImageClick={(img) => setLightbox({ image: img })}
                                            />
                                        </Reveal>
                                    ))}
                                </div>
                            )}

                            {/* Sporting Events — heading + description wraps naturally around the floated image block */}
                            {activePageKey === 'sportingEvents' && (
                                <div className="sports-list-col" style={{ display: 'flex', flexDirection: 'column', gap: '4rem', marginTop: '1rem' }}>
                                    {events.map((ev, i) => (
                                        <Reveal key={ev.id} delay={i * 0.1}>
                                            <EventStyleCard
                                                heading={ev.heading}
                                                description={ev.description}
                                                images={ev.images}
                                                tc={tc}
                                                bc={bc}
                                                onImageClick={(img) => setLightbox({ image: img })}
                                            />
                                        </Reveal>
                                    ))}
                                </div>
                            )}

                            {/* Awards page */}
                            {activePageKey === 'awards' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                                    {/* Photo carousel */}
                                    {pageData.images?.length > 0 && (
                                        <Reveal delay={0.1}>
                                            <PhotoCarousel images={pageData.images} tc={tc} />
                                        </Reveal>
                                    )}

                                    {/* Certifications */}
                                    {certifications.length > 0 && (
                                        <Reveal delay={0.15}>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1.5rem' }}>Certifications</p>
                                                <div className="sports-cert-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '22px', textAlign: 'left' }}>
                                                    {certifications.map((cert) => (
                                                        <div key={cert.id} className="cert-card" onClick={() => setLightbox({ image: cert.image, title: cert.title, info: cert.info })}
                                                            style={{ cursor: cert.image ? 'zoom-in' : 'default' }}>
                                                            {cert.image && (
                                                                <div className="cert-card-photo">
                                                                    <img src={cert.image} alt="" />
                                                                    <div className="cert-card-scrim"></div>
                                                                    <div className="cert-card-seal">
                                                                        <svg width="16" height="16" fill="none" stroke={tc.primary} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15a5 5 0 100-10 5 5 0 000 10z"/><path strokeLinecap="round" strokeLinejoin="round" d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5"/></svg>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="cert-card-body" style={{ padding: '1.15rem 1.25rem 1.3rem' }}>
                                                                <p className="cert-card-eyebrow" style={{ fontSize: '10px', color: tc.primary, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px', opacity: 0.85 }}>Certification</p>
                                                                {cert.title && <p className="cert-card-title" style={{ fontSize: '15.5px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px', marginBottom: '5px' }}>{cert.title}</p>}
                                                                {cert.info && <p className="cert-card-info" style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.6 }}>{cert.info}</p>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Reveal>
                                    )}

                                    {/* Making Us Proud */}
                                    {proud.length > 0 && (
                                        <Reveal delay={0.2}>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1.5rem' }}>Making Us Proud</p>
                                                <div className="sports-3col-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', textAlign: 'left' }}>
                                                    {proud.map((stu) => (
                                                        <div key={stu.id} className="proud-card">
                                                            {/* Photo with name/achievement overlaid on a dark scrim — editorial "player card" look */}
                                                            <div className="proud-card-photo">
                                                                {stu.photo && <img src={stu.photo} alt="" />}
                                                                <div className="proud-card-scrim"></div>
                                                                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '1.25rem 1.4rem 1.1rem', zIndex: 1 }}>
                                                                    {stu.name && <p style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: '5px', textShadow: '0 2px 10px rgba(0,0,0,0.85)' }}>{stu.name}</p>}
                                                                    {stu.achievement && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.88)', fontWeight: 600, letterSpacing: '0.03em', lineHeight: 1.5, textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>{stu.achievement}</p>}
                                                                </div>
                                                            </div>
                                                            {/* Colored footer bar — themed to the school's colors */}
                                                            <div style={{
                                                                background: `linear-gradient(90deg, ${tc.primary}, ${tc.secondary})`, padding: '9px 18px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                                            }}>
                                                                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{school.name}</span>
                                                                <svg width="13" height="13" fill="#ffffff" viewBox="0 0 24 24" opacity="0.9"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Reveal>
                                    )}

                                    {/* Yearly Awards — table of academic years with their award-winner PDF ── */}
                                    {yearlyAwards.length > 0 && (
                                        <Reveal delay={0.25}>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1.5rem' }}>Yearly Awards</p>
                                                <div style={{ maxWidth: '640px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                        <thead>
                                                            <tr style={{ background: tc.light }}>
                                                                <th style={{ padding: '14px 22px', fontSize: '11.5px', fontWeight: 700, color: tc.primary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Academic Year</th>
                                                                <th style={{ padding: '14px 22px', fontSize: '11.5px', fontWeight: 700, color: tc.primary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Award Winners</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {yearlyAwards.map((yr, i) => (
                                                                <tr key={yr.id} className="year-badge" onClick={() => window.open(yr.pdfUrl, '_blank')}
                                                                    style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : 'none', background: bc.card }}>
                                                                    <td style={{ padding: '14px 22px', fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>{yr.year}</td>
                                                                    <td style={{ padding: '14px 22px', fontSize: '13.5px', fontWeight: 600, color: tc.primary }}>
                                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6"/></svg>
                                                                            View PDF
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </Reveal>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Image Lightbox ── */}
                <ImageLightbox data={lightbox} onClose={() => setLightbox(null)} tc={tc} />

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default SportsPublic;