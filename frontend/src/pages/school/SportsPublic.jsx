import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import { getThemeColors } from "../../constants/publicNav";

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
const SportsAtGallery = ({ images, tc, onImageClick }) => {
    if (!images || images.length === 0) return null;

    const heroImages = images.slice(0, 7);
    const restImages = images.slice(7);

    // Explicit grid-line placement so every cell fills the 4-col × 3-row block with no gaps/overlap
    const heroSlots = [
        { gridColumn: '1 / 2', gridRow: '1 / 4' }, // tall left
        { gridColumn: '2 / 4', gridRow: '1 / 2' }, // wide top-middle
        { gridColumn: '4 / 5', gridRow: '1 / 3' }, // tall right-upper
        { gridColumn: '2 / 3', gridRow: '2 / 3' },
        { gridColumn: '3 / 4', gridRow: '2 / 4' }, // tall middle-right
        { gridColumn: '2 / 3', gridRow: '3 / 4' },
        { gridColumn: '4 / 5', gridRow: '3 / 4' },
    ];

    return (
        <div style={{ width: '100%' }}>
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(3, 160px)',
                gap: '14px', width: '100%'
            }}>
                {heroImages.map((img, i) => (
                    <div key={i} onClick={() => onImageClick(img)} style={{ ...heroSlots[i], borderRadius: '18px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', cursor: 'zoom-in' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                ))}
            </div>

            {restImages.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginTop: '14px' }}>
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
            <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', aspectRatio: '4/5', boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}>
                <img key={idx} src={images[idx]} alt="" onClick={() => onImageClick(images[idx])}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'zoom-in', animation: 'fadeIn 0.3s ease' }} />
                {images.length > 1 && (
                    <>
                        <button onClick={prev}
                            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', backdropFilter: 'blur(8px)', cursor: 'pointer' }}>
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                        </button>
                        <button onClick={next}
                            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', backdropFilter: 'blur(8px)', cursor: 'pointer' }}>
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                        </button>
                        <div style={{ position: 'absolute', bottom: '14px', right: '14px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '12px', fontWeight: 600, backdropFilter: 'blur(8px)' }}>
                            {idx + 1} / {images.length}
                        </div>
                    </>
                )}
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
const EventStyleCard = ({ heading, description, images, tc, onImageClick }) => {
    const words = (heading || '').trim().split(' ');
    const lastWord = words.pop();
    const restText = words.join(' ');
    const hasImages = images?.length > 0;

    return (
        <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '2rem', boxShadow: '0 6px 20px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
            {hasImages && (
                <div style={{ float: 'right', width: '340px', marginLeft: '2rem', marginBottom: '1rem' }}>
                    <SingleImageSlider images={images} tc={tc} onImageClick={onImageClick} />
                </div>
            )}
            <h3 style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 'clamp(22px,2.8vw,28px)', fontWeight: 800, letterSpacing: '-0.5px',
                lineHeight: 1.25, marginBottom: '0.9rem', color: '#0f172a', textAlign: 'left'
            }}>
                {restText ? `${restText} ` : ''}<span style={{ color: tc.primary }}>{lastWord}</span>
            </h3>
            {description && (
                <div className="rte-content" style={{ fontSize: '14.5px', color: '#64748b', lineHeight: 1.8, textAlign: 'left' }}
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

// ── Carousel for awards page photo gallery ──
const PhotoCarousel = ({ images, tc }) => {
    const [idx, setIdx] = useState(0);
    if (!images || images.length === 0) return null;
    return (
        <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.12)', height: '500px' }}>
            {images.map((img, i) => (
                <img key={i} src={img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === idx ? 1 : 0, transition: 'opacity 0.8s ease' }} />
            ))}
            {images.length > 1 && (
                <>
                    <button onClick={() => setIdx(p => p === 0 ? images.length - 1 : p - 1)}
                        style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <button onClick={() => setIdx(p => (p + 1) % images.length)}
                        style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </button>
                    <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
                        {images.map((_, i) => (
                            <div key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i === idx ? tc.primary : 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'all 0.3s' }}></div>
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
    const navbarSolid = scrollY > 60;

    if (!content) return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'system-ui, sans-serif' }}>
            <p style={{ fontSize: '18px', color: '#64748b' }}>Sports page not published yet</p>
            <button onClick={() => navigate(`/school/${slug}`)}
                style={{ padding: '12px 28px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                ← Back to Home
            </button>
        </div>
    );

    const pageData = content[activePageKey];
    if (!pageData) return null;

    const certifications = (pageData.certifications || []).filter(c => c.image || c.title);
    const proud = (pageData.proud || []).filter(p => p.photo || p.name);
    const yearlyAwards = (pageData.yearlyAwards || []).filter(y => y.year && y.pdfUrl);
    const events = pageData.events || [];
    const parallaxOffset = Math.min(scrollY * 0.4, 200);

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700;1,800&display=swap" rel="stylesheet" />
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes float3d { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
                @keyframes imgTickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                body { background: #ffffff; }
                .premium-heading {
                    font-family: 'Playfair Display', Georgia, serif;
                    font-style: italic;
                    font-weight: 700;
                }
                .img-ticker-track { display: flex; width: max-content; animation: imgTickerScroll 30s linear infinite; }
                .img-ticker-track:hover { animation-play-state: paused; }
                .sidebar-link { transition: all 0.2s; }
                .cert-card { transition: transform 0.3s ease; }
                .cert-card:hover { transform: translateY(-6px); }
                .proud-card { transition: transform 0.3s ease; }
                .proud-card:hover { transform: translateY(-6px); }
                .year-badge { transition: background 0.2s; cursor: pointer; }
                .year-badge:hover { background: ${tc.light} !important; }
                .rte-content { overflow-wrap: break-word; }
                .rte-content p { margin-bottom: 0.6em; }
                .rte-content p:last-child { margin-bottom: 0; }
                .rte-content strong { font-weight: 700; }
                .rte-content em { font-style: italic; }
                .rte-content u { text-decoration: underline; }
                .rte-content .ql-size-small { font-size: 0.75em; }
                .rte-content .ql-size-large { font-size: 1.5em; }
                .rte-content .ql-size-huge { font-size: 2.5em; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="sports" />

                {/* ── Hero Banner with Parallax ── */}
                <div style={{ height: '90vh', position: 'relative', overflow: 'hidden' }}>
                    {pageData.banner ? (
                        <img src={pageData.banner} alt=""
                            style={{
                                position: 'absolute', top: `-${parallaxOffset}px`, left: 0, width: '100%', height: '120%',
                                objectFit: 'cover', transform: `scale(${1 + scrollY * 0.0003})`
                            }} />
                    ) : (
                        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${tc.primary},${tc.secondary})` }}></div>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.35) 60%, #ffffff 100%)' }}></div>

                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 2rem' }}>
                        <p style={{
                            fontSize: '13px', color: '#fff', letterSpacing: '0.3em', textTransform: 'uppercase',
                            marginBottom: '20px', opacity: Math.max(1 - scrollY / 300, 0), textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                        }}>
                            {school.name}
                        </p>
                        <h1 style={{
                            fontSize: 'clamp(40px, 7vw, 96px)', fontWeight: 900, letterSpacing: '-2.5px', lineHeight: 1,
                            color: '#ffffff', textShadow: '0 4px 30px rgba(0,0,0,0.3)',
                            opacity: Math.max(1 - scrollY / 400, 0), transform: `translateY(${scrollY * 0.2}px)`,
                            fontStyle: pageData.headingItalic ? 'italic' : 'normal',
                        }}>
                            {pageData.heading || PAGES.find(p => p.key === activePageKey)?.label}
                        </h1>
                    </div>

                    <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', opacity: Math.max(1 - scrollY / 150, 0) }}>
                        <svg width="22" height="22" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" viewBox="0 0 24 24" style={{ animation: 'float3d 2s ease-in-out infinite' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                </div>

                {/* ── Body — single centered column, wider to reduce excess side margins ── */}
<div style={{ padding: '5rem 2.5rem 7rem', background: '#ffffff', width: '100%', boxSizing: 'border-box' }}>
    <div style={{ maxWidth: '1140px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

                        {/* Main content */}
                        <div>
                            <Reveal style={{ textAlign: 'left' }}>
                                {(() => {
                                    const headingText = pageData.heading || PAGES.find(p => p.key === activePageKey)?.label || '';
                                    const words = headingText.trim().split(' ');
                                    const lastWord = words.pop();
                                    const restText = words.join(' ');
                                    return (
                                        <h2 style={{
                                            fontFamily: "'Inter', system-ui, sans-serif",
                                            fontSize: 'clamp(28px,3.5vw,38px)', fontWeight: 800, letterSpacing: '-0.5px',
                                            lineHeight: 1.2, marginBottom: '1.1rem', color: '#0f172a',
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
                                        tc={tc}
                                        onImageClick={(img) => setLightbox({ image: img })}
                                    />
                                </Reveal>
                            )}

                            {/* Sports Offered — same list pattern as Sporting Events, using the same EventStyleCard */}
                            {activePageKey === 'sportsOffered' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', marginTop: '1rem' }}>
                                    {(pageData.offeredSports || []).map((sp, i) => (
                                        <Reveal key={sp.id} delay={i * 0.1}>
                                            <EventStyleCard
                                                heading={sp.heading}
                                                description={sp.description}
                                                images={sp.images}
                                                tc={tc}
                                                onImageClick={(img) => setLightbox({ image: img })}
                                            />
                                        </Reveal>
                                    ))}
                                </div>
                            )}

                            {/* Sporting Events — heading + description wraps naturally around the floated image block */}
                            {activePageKey === 'sportingEvents' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', marginTop: '1rem' }}>
                                    {events.map((ev, i) => (
                                        <Reveal key={ev.id} delay={i * 0.1}>
                                            <EventStyleCard
                                                heading={ev.heading}
                                                description={ev.description}
                                                images={ev.images}
                                                tc={tc}
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
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', textAlign: 'left' }}>
                                                    {certifications.map((cert, i) => (
                                                        <div key={cert.id} className="cert-card" onClick={() => setLightbox({ image: cert.image, title: cert.title, info: cert.info })}
                                                            style={{ border: '1px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.05)', cursor: cert.image ? 'zoom-in' : 'default' }}>
                                                            {cert.image && (
                                                                <div style={{ height: '160px', background: tc.light, overflow: 'hidden' }}>
                                                                    <img src={cert.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                </div>
                                                            )}
                                                            <div style={{ padding: '1rem' }}>
                                                                {cert.title && <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{cert.title}</p>}
                                                                {cert.info && <p style={{ fontSize: '12px', color: '#64748b' }}>{cert.info}</p>}
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
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', textAlign: 'left' }}>
                                                    {proud.map((stu) => (
                                                        <div key={stu.id} className="proud-card" style={{
                                                            borderRadius: '22px', overflow: 'hidden',
                                                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: '#ffffff'
                                                        }}>
                                                            {/* Photo header with decorative badge icon — themed to the school's color */}
                                                            <div style={{ position: 'relative', height: '320px', background: tc.light, overflow: 'hidden' }}>
                                                                {stu.photo && (
                                                                    <img src={stu.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                )}
                                                                <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                    <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        <svg width="13" height="13" fill={tc.primary} viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z"/></svg>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* White info section */}
                                                            <div style={{ padding: '1.1rem 1.25rem 0.9rem' }}>
                                                                {stu.name && <p style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: '4px' }}>{stu.name}</p>}
                                                                {stu.achievement && <p style={{ fontSize: '12px', color: tc.primary, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.5 }}>{stu.achievement}</p>}
                                                            </div>
                                                            {/* Colored footer bar — themed to the school's primary color */}
                                                            <div style={{
                                                                background: tc.primary, padding: '10px 18px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                                            }}>
                                                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{school.name}</span>
                                                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <svg width="11" height="11" fill="#ffffff" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
                                                                </div>
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
                                                                    style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : 'none', background: '#ffffff' }}>
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