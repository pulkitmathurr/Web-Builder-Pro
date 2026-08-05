import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { getFontFamily } from "../../constants/fonts";

const LEVEL_MAP = {
    'primary-school': { key: 'primary', label: 'Primary School' },
    'middle-school': { key: 'middle', label: 'Middle School' },
    'high-school': { key: 'high', label: 'High School' },
    'senior-school': { key: 'senior', label: 'Senior School' },
};

const useScrollReveal = () => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.15 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, visible];
};

const Reveal = ({ children, delay = 0, style = {}, className }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div ref={ref} className={className} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(40px)',
            transition: `opacity 0.8s ease ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
            ...style
        }}>
            {children}
        </div>
    );
};

const SchoolLevelPublic = () => {
    const { slug, levelSlug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [allLevels, setAllLevels] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const [galleryIndex, setGalleryIndex] = useState(0);

    const levelInfo = LEVEL_MAP[levelSlug];

    useEffect(() => {
        fetchData();
        setGalleryIndex(0);
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        window.scrollTo(0, 0);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [slug, levelSlug]);

    const fetchData = async () => {
        try {
            const res = await getPublicSchoolApi(slug);
            setSchool(res.data);
            if (res.data?.id) {
                const contentRes = await getPublicModuleContentApi(res.data.id, 'courses');
                setAllLevels(contentRes.data);
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

    if (!school || !levelInfo) return null;

    const tc = getThemeColors(school.theme);
    const bc = getBaseColors(school.base_theme);
    const navbarSolid = scrollY > 60;

    if (!isModuleEnabled(school, 'courses')) return <NotPublished tc={tc} slug={slug} label={levelInfo.label} reason="disabled" />;

    const data = allLevels?.[levelInfo.key];
    const enabledLevels = allLevels ? Object.entries(LEVEL_MAP).filter(([slug2, info]) => allLevels[info.key]?.enabled) : [];

    if (!data || !data.enabled) return <NotPublished tc={tc} slug={slug} label={levelInfo.label} />;

    const gallery = data.gallery || [];

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
                body { background: ${bc.surface}; }
                .gallery-arrow { transition: all 0.2s; }
                .gallery-arrow:hover { background: ${tc.primary} !important; color: #fff !important; transform: scale(1.1); }
                .lvl-frame { position: relative; padding: 12px; }
                .lvl-frame::before {
                    content: ''; position: absolute; inset: 0; border: 1.5px solid ${tc.primary}55;
                    border-radius: 18px; transition: inset 0.5s cubic-bezier(0.16,1,0.3,1), border-color 0.5s ease;
                }
                .lvl-frame:hover::before { inset: -8px; border-color: ${tc.primary}; }
                .lvl-frame-inner { position: relative; border-radius: 12px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.14); }
                .lvl-frame-corner { position: absolute; width: 20px; height: 20px; z-index: 3; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); pointer-events: none; }
                .lvl-corner-tl { top: -6px; left: -6px; border-top: 3px solid ${tc.primary}; border-left: 3px solid ${tc.primary}; }
                .lvl-corner-tr { top: -6px; right: -6px; border-top: 3px solid ${tc.primary}; border-right: 3px solid ${tc.primary}; }
                .lvl-corner-bl { bottom: -6px; left: -6px; border-bottom: 3px solid ${tc.primary}; border-left: 3px solid ${tc.primary}; }
                .lvl-corner-br { bottom: -6px; right: -6px; border-bottom: 3px solid ${tc.primary}; border-right: 3px solid ${tc.primary}; }
                .lvl-frame:hover .lvl-corner-tl { top: -12px; left: -12px; }
                .lvl-frame:hover .lvl-corner-tr { top: -12px; right: -12px; }
                .lvl-frame:hover .lvl-corner-bl { bottom: -12px; left: -12px; }
                .lvl-frame:hover .lvl-corner-br { bottom: -12px; right: -12px; }
                .rte-content { overflow-wrap: normal; word-break: normal; }
                .rte-content p { margin-bottom: 0.8em; }
                .rte-content p:last-child { margin-bottom: 0; }
                .rte-content strong { font-weight: 700; }
                .rte-content em { font-style: italic; }
                .rte-content u { text-decoration: underline; }
                .rte-content ul, .rte-content ol { padding-left: 1.5em; margin-bottom: 0.8em; }
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
                @media (max-width: 640px) {
                    /* ── About / Why Unique — the image no longer floats beside the text
                       (which left almost no room for the text next to a 300px-wide image on
                       a phone). Reordered via flex so the header/description text always
                       reads first, with the image as its own centered block below it. ── */
                    .lvl-about-container, .lvl-unique-container {
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    .lvl-about-text-wrap, .lvl-unique-text-wrap { order: 1 !important; }
                    .lvl-about-img-wrap, .lvl-unique-img-wrap {
                        order: 2 !important;
                        float: none !important;
                        width: 100% !important;
                        max-width: 280px !important;
                        margin: 1.75rem auto 0 !important;
                    }
                    .lvl-gallery-heading { font-size: 26px !important; }

                    /* ── Left accent border beside the description — desktop-only flourish, drop it on mobile ── */
                    .lvl-accent-block { border-left: none !important; padding-left: 0 !important; margin-left: 0 !important; }
                }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="courses" />

                {/* ── Header — no banner photo, clean gradient header (same design as About Us) ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'clamp(3rem,14vw,4.5rem) clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-1px', marginBottom: '10px' }}>
                            {levelInfo.label}
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* ── About — image floats left, description wraps and reclaims full width once the image ends ── */}
                {(data.aboutHeading || data.aboutQuote) && (
                    <div style={{ padding: 'clamp(2rem,8vw,4rem) clamp(1.25rem,6vw,5rem)', background: bc.surface }}>
                        <div className="lvl-about-container" style={{ maxWidth: '1300px', margin: '0 auto', position: 'relative' }}>
                            {data.aboutImage && (
                                <Reveal className="lvl-about-img-wrap" style={{ float: 'left', width: '300px', marginRight: '3rem', marginBottom: '1rem', position: 'relative', zIndex: 2 }}>
                                    <div className="lvl-frame">
                                        <span className="lvl-frame-corner lvl-corner-tl"></span>
                                        <span className="lvl-frame-corner lvl-corner-tr"></span>
                                        <span className="lvl-frame-corner lvl-corner-bl"></span>
                                        <span className="lvl-frame-corner lvl-corner-br"></span>
                                        <div className="lvl-frame-inner" style={{ aspectRatio: '3/4' }}>
                                            <img src={data.aboutImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        </div>
                                    </div>
                                </Reveal>
                            )}
                            <Reveal delay={0.2} className="lvl-about-text-wrap">
                                <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '20px' }}>#{school.name.replace(/\s+/g, '')}</p>
                                {data.aboutHeading && (
                                    <h2 style={{ fontFamily: data.aboutHeadingFont ? getFontFamily(data.aboutHeadingFont) : undefined, fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 800, color: data.aboutHeadingColor || '#0f172a', letterSpacing: '-1.5px', lineHeight: 1.15, marginBottom: '1.25rem', fontStyle: data.aboutHeadingItalic ? 'italic' : 'normal' }}>
                                        "{data.aboutHeading}"
                                    </h2>
                                )}
                                {data.aboutQuote && (
                                    /* Border sits in the left gutter (negative margin cancels the padding)
                                       so the quote text itself stays flush with the heading above it. */
                                    <div className="lvl-accent-block" style={{ borderLeft: `3px solid ${tc.primary}`, paddingLeft: '1.5rem', marginLeft: '-1.5rem', marginBottom: '1.25rem' }}>
                                        <div className="rte-content" style={{ fontSize: '15.5px', color: '#64748b', lineHeight: 1.9 }}
                                            dangerouslySetInnerHTML={{ __html: data.aboutQuote }} />
                                    </div>
                                )}
                                {data.aboutAuthor && (
                                    <p style={{ fontSize: '15px', color: '#0f172a', fontWeight: 600 }}>
                                        — {data.aboutAuthor}{data.aboutAuthorDesignation && <span style={{ color: '#94a3b8', fontWeight: 400 }}>, {data.aboutAuthorDesignation}</span>}
                                    </p>
                                )}
                            </Reveal>
                            <div style={{ clear: 'both' }}></div>
                        </div>
                    </div>
                )}

                {/* ── Why Unique — image floats right, description wraps and reclaims full width once the image ends ── */}
                {(data.uniqueHeading || data.uniqueText) && (
                    <div style={{ padding: 'clamp(2rem,8vw,4rem) clamp(1.25rem,6vw,5rem)', background: bc.surface }}>
                        <div className="lvl-unique-container" style={{ maxWidth: '1300px', margin: '0 auto', position: 'relative' }}>
                            {data.uniqueImage && (
                                <Reveal delay={0.15} className="lvl-unique-img-wrap" style={{ float: 'right', width: '300px', marginLeft: '3rem', marginBottom: '1rem', position: 'relative', zIndex: 2 }}>
                                    <div className="lvl-frame">
                                        <span className="lvl-frame-corner lvl-corner-tl"></span>
                                        <span className="lvl-frame-corner lvl-corner-tr"></span>
                                        <span className="lvl-frame-corner lvl-corner-bl"></span>
                                        <span className="lvl-frame-corner lvl-corner-br"></span>
                                        <div className="lvl-frame-inner" style={{ aspectRatio: '3/4' }}>
                                            <img src={data.uniqueImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        </div>
                                    </div>
                                </Reveal>
                            )}
                            <Reveal className="lvl-unique-text-wrap">
                                <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '20px' }}>What Sets Us Apart</p>
                                {data.uniqueHeading && (
                                    <h2 style={{ fontFamily: data.uniqueHeadingFont ? getFontFamily(data.uniqueHeadingFont) : undefined, fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 800, color: data.uniqueHeadingColor || '#0f172a', letterSpacing: '-1.5px', lineHeight: 1.15, marginBottom: '1.25rem', fontStyle: data.uniqueHeadingItalic ? 'italic' : 'normal' }}>
                                        {data.uniqueHeading}
                                    </h2>
                                )}
                                {data.uniqueText && (
                                    <div className="lvl-accent-block" style={{ borderLeft: `3px solid ${tc.primary}`, paddingLeft: '1.5rem', marginLeft: '-1.5rem' }}>
                                        <div className="rte-content" style={{ fontSize: '15.5px', color: '#64748b', lineHeight: 1.9 }}
                                            dangerouslySetInnerHTML={{ __html: data.uniqueText }} />
                                    </div>
                                )}
                            </Reveal>
                            <div style={{ clear: 'both' }}></div>
                        </div>
                    </div>
                )}

                {/* ── Gallery ── */}
                {gallery.length > 0 && (
                    <div style={{ padding: 'clamp(2rem,8vw,4rem) clamp(1.25rem,6vw,5rem)', background: bc.surface, position: 'relative' }}>
                        <Reveal>
                            <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
                                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                                    <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '14px' }}>Campus Life</p>
                                    <h2 className="lvl-gallery-heading" style={{ fontSize: '38px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1.5px' }}>{levelInfo.label} Gallery</h2>
                                </div>

                                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                                    <div className="lvl-frame">
                                        <span className="lvl-frame-corner lvl-corner-tl"></span>
                                        <span className="lvl-frame-corner lvl-corner-tr"></span>
                                        <span className="lvl-frame-corner lvl-corner-bl"></span>
                                        <span className="lvl-frame-corner lvl-corner-br"></span>
                                        <div className="lvl-frame-inner" style={{ aspectRatio: '16/9' }}>
                                            <img src={gallery[galleryIndex]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.3s' }} />
                                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '90px', background: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.35))', pointerEvents: 'none' }}></div>

                                            {gallery.length > 1 && (
                                                <>
                                                    <button className="gallery-arrow" onClick={() => setGalleryIndex(p => p === 0 ? gallery.length - 1 : p - 1)}
                                                        style={{ position: 'absolute', left: '14px', top: '50%', marginTop: '-22px', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', backdropFilter: 'blur(10px)', boxShadow: '0 8px 20px rgba(0,0,0,0.18)' }}>
                                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                                                    </button>
                                                    <button className="gallery-arrow" onClick={() => setGalleryIndex(p => p === gallery.length - 1 ? 0 : p + 1)}
                                                        style={{ position: 'absolute', right: '14px', top: '50%', marginTop: '-22px', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', backdropFilter: 'blur(10px)', boxShadow: '0 8px 20px rgba(0,0,0,0.18)' }}>
                                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                                                    </button>
                                                    <div style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
                                                        {gallery.map((_, i) => (
                                                            <div key={i} onClick={() => setGalleryIndex(i)} style={{ width: i === galleryIndex ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i === galleryIndex ? '#ffffff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.3s' }}></div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                )}

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default SchoolLevelPublic;