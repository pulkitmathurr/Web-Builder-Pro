import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { getFontFamily } from "../../constants/fonts";
import { RTE_LIST_CSS } from "../../constants/rteContentStyles";

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

const Reveal = ({ children, delay = 0, style = {}, className }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)', transition: `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>
            {children}
        </div>
    );
};

const InfrastructurePublic = () => {
    const { slug, categorySlug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [activeImgIdx, setActiveImgIdx] = useState(0);

    useEffect(() => {
        fetchData();
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        window.scrollTo(0, 0);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [slug, categorySlug]);

    useEffect(() => { setActiveImgIdx(0); }, [categorySlug]);

    const fetchData = async () => {
        try {
            const res = await getPublicSchoolApi(slug);
            setSchool(res.data);
            if (res.data?.id) {
                const contentRes = await getPublicModuleContentApi(res.data.id, 'infrastructure');
                // Non-null means published (the public endpoint only returns published
                // rows) — show the page even before any categories have been added.
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

    if (!isModuleEnabled(school, 'infrastructure')) return <NotPublished tc={tc} slug={slug} label="Infrastructure" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Infrastructure" />;

    const categories = content.categories || [];

    // Published, but no categories added yet — render a minimal shell (header +
    // Footer pushed below the fold) so the module still reads as "live", rather
    // than falling through to the "category doesn't exist" screen below.
    if (categories.length === 0) return (
        <>
            <style>{`* { margin: 0; padding: 0; box-sizing: border-box; }`}</style>
            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="infrastructure" />
                <div style={{ minHeight: '100vh' }}>
                    <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'calc(92px + 1.6rem) clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-1px', marginBottom: '10px' }}>
                                Infrastructure
                            </h1>
                            <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                        </div>
                    </div>
                </div>
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );

    const activeCat = categorySlug
        ? categories.find(c => c.slug === categorySlug)
        : categories[0];

    if (!activeCat) return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'system-ui, sans-serif' }}>
            <p style={{ fontSize: '18px', color: '#64748b' }}>This category doesn't exist</p>
            <button onClick={() => navigate(`/school/${slug}`)}
                style={{ padding: '12px 28px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                ← Back to Home
            </button>
        </div>
    );

    const images = activeCat.images || [];
    const activeImg = images[activeImgIdx] || images[0];

    const goPrevImg = () => setActiveImgIdx(p => (p === 0 ? images.length - 1 : p - 1));
    const goNextImg = () => setActiveImgIdx(p => (p + 1) % images.length);

    const galleryImages = activeCat.horizontalImages || [];

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                body { background: ${bc.surface}; }
                .infra-cat-tab { transition: all 0.2s; }
                .infra-slide-btn { transition: all 0.25s cubic-bezier(0.16,1,0.3,1); cursor: pointer; }
                .infra-slide-btn:hover { transform: scale(1.1); box-shadow: 0 12px 28px rgba(0,0,0,0.22); }
                .infra-slide-btn:active { transform: scale(0.96); }
                .infra-dot { transition: all 0.25s ease; cursor: pointer; }
                .infra-dot:hover { opacity: 0.75; }
                .infra-slide-img { cursor: pointer; }
                .infra-frame { position: relative; padding: 12px; }
                .infra-frame::before {
                    content: ''; position: absolute; inset: 0; border: 1.5px solid ${tc.primary}55;
                    border-radius: 18px; transition: inset 0.5s cubic-bezier(0.16,1,0.3,1), border-color 0.5s ease;
                }
                .infra-frame:hover::before { inset: -8px; border-color: ${tc.primary}; }
                .infra-frame-inner { position: relative; border-radius: 12px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.14); }
                .infra-frame-corner { position: absolute; width: 20px; height: 20px; z-index: 3; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); pointer-events: none; }
                .infra-corner-tl { top: -6px; left: -6px; border-top: 3px solid ${tc.primary}; border-left: 3px solid ${tc.primary}; }
                .infra-corner-tr { top: -6px; right: -6px; border-top: 3px solid ${tc.primary}; border-right: 3px solid ${tc.primary}; }
                .infra-corner-bl { bottom: -6px; left: -6px; border-bottom: 3px solid ${tc.primary}; border-left: 3px solid ${tc.primary}; }
                .infra-corner-br { bottom: -6px; right: -6px; border-bottom: 3px solid ${tc.primary}; border-right: 3px solid ${tc.primary}; }
                .infra-frame:hover .infra-corner-tl { top: -12px; left: -12px; }
                .infra-frame:hover .infra-corner-tr { top: -12px; right: -12px; }
                .infra-frame:hover .infra-corner-bl { bottom: -12px; left: -12px; }
                .infra-frame:hover .infra-corner-br { bottom: -12px; right: -12px; }
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
                ${RTE_LIST_CSS}
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
                .infra-gallery-tile img { transition: transform 0.6s cubic-bezier(0.16,1,0.3,1); }
                .infra-gallery-tile-overlay, .infra-gallery-tile-ring { transition: opacity 0.4s ease; }
                .infra-gallery-tile { transition: transform 0.45s cubic-bezier(0.16,1,0.3,1), box-shadow 0.45s ease; }
                .infra-gallery-tile:hover { transform: translateY(-8px); box-shadow: 0 22px 46px rgba(15,23,42,0.24) !important; }
                .infra-gallery-tile:hover img { transform: scale(1.1); }
                .infra-gallery-tile:hover .infra-gallery-tile-overlay, .infra-gallery-tile:hover .infra-gallery-tile-ring { opacity: 1 !important; }
                @keyframes infraGalleryScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                .infra-gallery-ticker-track { display: flex; width: max-content; animation: infraGalleryScroll ${Math.max(20, galleryImages.length * 6)}s linear infinite; }
                .infra-gallery-ticker-track:hover { animation-play-state: paused; }
                @media (max-width: 640px) {
                    .infra-float-img { float: none !important; width: 100% !important; max-width: 320px; margin: 0 auto 1.5rem !important; }
                    /* ── Category tabs — horizontal swipeable strip instead of wrapping to multiple lines ── */
                    .infra-cat-tabs { flex-wrap: nowrap !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; scrollbar-width: none !important; padding-bottom: 2px !important; }
                    .infra-cat-tabs::-webkit-scrollbar { display: none !important; }
                    .infra-cat-tab { flex-shrink: 0 !important; padding: 7px 14px !important; font-size: 12.5px !important; white-space: nowrap !important; }
                    .infra-gallery-tile { width: 210px !important; margin: 0 8px !important; border-radius: 13px !important; }
                }
                @media (max-width: 400px) {
                    .infra-gallery-tile { width: 180px !important; margin: 0 6px !important; }
                }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="infrastructure" />

                {/* Content wrapper — one full viewport min-height so a published-but-empty
                    page pushes the Footer below the fold instead of under the header. */}
                <div style={{ minHeight: '100vh' }}>

                {/* ── Header — no banner photo, clean gradient header (same design as About Us) ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'calc(92px + 1.6rem) clamp(1.25rem,6vw,3rem) 0.6rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: activeCat.headingFont ? getFontFamily(activeCat.headingFont) : "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 3.4vw, 38px)', fontWeight: 800, color: activeCat.headingColor || '#ffffff', letterSpacing: '-1px', marginBottom: '8px', fontStyle: activeCat.headingItalic ? 'italic' : 'normal' }}>
                            {activeCat.heading || activeCat.name}
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* ── Category Tabs ── */}
                {categories.length > 1 && (
                    <div style={{ padding: '1.5rem clamp(1.25rem,6vw,5rem) 0', background: bc.surface }}>
                        <div className="infra-cat-tabs" style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {categories.map(cat => (
                                <button key={cat.id} className="infra-cat-tab"
                                    onClick={() => navigate(`/school/${slug}/infrastructure/${cat.slug}`)}
                                    style={{
                                        padding: '8px 18px', borderRadius: '30px', cursor: 'pointer',
                                        border: cat.slug === activeCat.slug ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0',
                                        background: cat.slug === activeCat.slug ? tc.light : bc.card,
                                        color: cat.slug === activeCat.slug ? tc.primary : '#64748b',
                                        fontSize: '13.5px', fontWeight: cat.slug === activeCat.slug ? 700 : 500,
                                    }}>
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Body — image floats beside the description, exactly like the About page's History section ── */}
                <div style={{ padding: '2rem clamp(1.25rem,6vw,5rem) 3rem', background: bc.surface }}>
                    <div style={{ maxWidth: '1300px', margin: '0 auto', position: 'relative' }}>

                        {/* Image slider — one image at a time, framed like the About page's History section */}
                        {images.length > 0 && (
                            <Reveal className="infra-float-img" delay={0.15} style={{ float: 'right', width: '260px', marginLeft: '2rem', marginBottom: '1rem', position: 'relative', zIndex: 2 }}>
                                <div className="infra-frame">
                                    <span className="infra-frame-corner infra-corner-tl"></span>
                                    <span className="infra-frame-corner infra-corner-tr"></span>
                                    <span className="infra-frame-corner infra-corner-bl"></span>
                                    <span className="infra-frame-corner infra-corner-br"></span>
                                    <div className="infra-frame-inner" style={{ aspectRatio: '3/4' }}>
                                        <img key={activeImgIdx} className="infra-slide-img" src={activeImg} alt=""
                                            onClick={() => setLightboxOpen(true)}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', animation: 'fadeIn 0.3s ease' }} />

                                        {images.length > 1 && (
                                            <>
                                                <button className="infra-slide-btn" onClick={goPrevImg}
                                                    onMouseEnter={e => { e.currentTarget.style.background = tc.primary; e.currentTarget.style.color = '#fff'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; e.currentTarget.style.color = '#0f172a'; }}
                                                    style={{ position: 'absolute', left: '10px', top: '50%', marginTop: '-19px', width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', backdropFilter: 'blur(10px)', boxShadow: '0 8px 20px rgba(0,0,0,0.18)' }}>
                                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                                                </button>
                                                <button className="infra-slide-btn" onClick={goNextImg}
                                                    onMouseEnter={e => { e.currentTarget.style.background = tc.primary; e.currentTarget.style.color = '#fff'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; e.currentTarget.style.color = '#0f172a'; }}
                                                    style={{ position: 'absolute', right: '10px', top: '50%', marginTop: '-19px', width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', backdropFilter: 'blur(10px)', boxShadow: '0 8px 20px rgba(0,0,0,0.18)' }}>
                                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                                                </button>
                                                <div style={{ position: 'absolute', bottom: '10px', right: '10px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', backdropFilter: 'blur(10px)' }}>
                                                    {activeImgIdx + 1} / {images.length}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {images.length > 1 && (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
                                        {images.map((_, i) => (
                                            <div key={i} className="infra-dot" onClick={() => setActiveImgIdx(i)}
                                                style={{ width: i === activeImgIdx ? '26px' : '8px', height: '8px', borderRadius: '4px', background: i === activeImgIdx ? tc.primary : '#e2e8f0', boxShadow: i === activeImgIdx ? `0 2px 8px ${tc.primary}50` : 'none' }}></div>
                                        ))}
                                    </div>
                                )}
                            </Reveal>
                        )}

                        {/* Description */}
                        <Reveal>
                            {activeCat.description && (
                                <div className="rte-content" style={{ fontSize: '15.5px', color: '#475569', lineHeight: 1.9 }}
                                    dangerouslySetInnerHTML={{ __html: activeCat.description }} />
                            )}
                        </Reveal>
                        <div style={{ clear: 'both' }}></div>
                    </div>
                </div>

                {/* ── Horizontal Gallery — auto-scrolling ticker, styled like the Home page's Campus Glimpses ── */}
                {galleryImages.length > 0 && (
                    <div style={{ padding: '0 clamp(1.25rem,6vw,5rem) 3rem', background: bc.surface }}>
                        <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
                            <Reveal>
                                <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}></p>
                            </Reveal>
                            <Reveal delay={0.1} style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100px', background: `linear-gradient(90deg,${bc.surface},transparent)`, zIndex: 2, pointerEvents: 'none' }}></div>
                                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '100px', background: `linear-gradient(270deg,${bc.surface},transparent)`, zIndex: 2, pointerEvents: 'none' }}></div>
                                <div style={{ overflow: 'hidden' }}>
                                    <div className="infra-gallery-ticker-track">
                                        {[...galleryImages, ...galleryImages].map((img, i) => (
                                            <div key={`${img}-${i}`} className="infra-gallery-tile" style={{ position: 'relative', flexShrink: 0, width: '360px', margin: '0 12px', borderRadius: '18px', overflow: 'hidden', aspectRatio: '16 / 9', boxShadow: '0 10px 30px rgba(15,23,42,0.14)', border: '1px solid rgba(255,255,255,0.6)' }}>
                                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                <div className="infra-gallery-tile-overlay" style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 45%, ${tc.dark}cc 100%)`, opacity: 0 }} />
                                                <div className="infra-gallery-tile-ring" style={{ position: 'absolute', inset: '10px', border: `1.5px solid ${tc.secondary}`, borderRadius: '11px', opacity: 0 }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Reveal>
                        </div>
                    </div>
                )}

                {/* ── Lightbox ── */}
                {lightboxOpen && (
                    <div onClick={() => setLightboxOpen(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', animation: 'fadeIn 0.25s ease' }}>
                        <img key={activeImgIdx} src={activeImg} alt="" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()} />
                        <button onClick={() => setLightboxOpen(false)}
                            style={{ position: 'absolute', top: '2rem', right: '2rem', width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                        {images.length > 1 && (
                            <>
                                <button className="infra-slide-btn" onClick={e => { e.stopPropagation(); goPrevImg(); }}
                                    onMouseEnter={e => { e.currentTarget.style.background = tc.primary; e.currentTarget.style.borderColor = tc.primary; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                                    style={{ position: 'absolute', left: '2rem', top: '50%', marginTop: '-23px', width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                                </button>
                                <button className="infra-slide-btn" onClick={e => { e.stopPropagation(); goNextImg(); }}
                                    onMouseEnter={e => { e.currentTarget.style.background = tc.primary; e.currentTarget.style.borderColor = tc.primary; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                                    style={{ position: 'absolute', right: '2rem', top: '50%', marginTop: '-23px', width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                                </button>
                                <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', padding: '5px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '12.5px', fontWeight: 600, backdropFilter: 'blur(8px)' }}>
                                    {activeImgIdx + 1} / {images.length}
                                </div>
                            </>
                        )}
                    </div>
                )}

                </div>{/* /content wrapper */}

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default InfrastructurePublic;