import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import { getThemeColors } from "../../constants/publicNav";

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
                if (contentRes.data?.categories?.length > 0) setContent(contentRes.data);
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
            <p style={{ fontSize: '18px', color: '#64748b' }}>Infrastructure page not published yet</p>
            <button onClick={() => navigate(`/school/${slug}`)}
                style={{ padding: '12px 28px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                ← Back to Home
            </button>
        </div>
    );

    const categories = content.categories || [];
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
    const parallaxOffset = Math.min(scrollY * 0.4, 200);

    const goPrevImg = () => setActiveImgIdx(p => (p === 0 ? images.length - 1 : p - 1));
    const goNextImg = () => setActiveImgIdx(p => (p + 1) % images.length);

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes float3d { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
                body { background: #ffffff; }
                .infra-cat-tab { transition: all 0.2s; }
                .infra-slide-btn { transition: all 0.25s cubic-bezier(0.16,1,0.3,1); cursor: pointer; }
                .infra-slide-btn:hover { transform: scale(1.1); box-shadow: 0 12px 28px rgba(0,0,0,0.22); }
                .infra-slide-btn:active { transform: scale(0.96); }
                .infra-dot { transition: all 0.25s ease; cursor: pointer; }
                .infra-dot:hover { opacity: 0.75; }
                .infra-slide-img { cursor: pointer; }
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
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="infrastructure" />

                {/* ── Hero Banner with Parallax ── */}
                <div style={{ height: '90vh', position: 'relative', overflow: 'hidden' }}>
                    {activeCat.banner ? (
                        <img src={activeCat.banner} alt=""
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
                            fontStyle: activeCat.headingItalic ? 'italic' : 'normal',
                        }}>
                            {activeCat.heading || activeCat.name}
                        </h1>
                    </div>

                    <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', opacity: Math.max(1 - scrollY / 150, 0) }}>
                        <svg width="22" height="22" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" viewBox="0 0 24 24" style={{ animation: 'float3d 2s ease-in-out infinite' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                </div>

                {/* ── Category Tabs ── */}
                {categories.length > 1 && (
                    <div style={{ padding: '2.5rem 5rem 0', background: '#ffffff' }}>
                        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {categories.map(cat => (
                                <button key={cat.id} className="infra-cat-tab"
                                    onClick={() => navigate(`/school/${slug}/infrastructure/${cat.slug}`)}
                                    style={{
                                        padding: '10px 22px', borderRadius: '30px', cursor: 'pointer',
                                        border: cat.slug === activeCat.slug ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0',
                                        background: cat.slug === activeCat.slug ? tc.light : '#ffffff',
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
                <div style={{ padding: '4rem 5rem 7rem', background: '#ffffff' }}>
                    <div style={{ maxWidth: '1300px', margin: '0 auto', position: 'relative' }}>

                        {/* Image slider — one image at a time */}
                        {images.length > 0 && (
                            <Reveal delay={0.15} style={{ float: 'right', width: '460px', marginLeft: '3.5rem', marginBottom: '1rem', position: 'relative', zIndex: 2 }}>
                                <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', aspectRatio: '4/5', boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}>
                                    <img key={activeImgIdx} className="infra-slide-img" src={activeImg} alt=""
                                        onClick={() => setLightboxOpen(true)}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', animation: 'fadeIn 0.3s ease' }} />

                                    {images.length > 1 && (
                                        <>
                                            <button className="infra-slide-btn" onClick={goPrevImg}
                                                onMouseEnter={e => { e.currentTarget.style.background = tc.primary; e.currentTarget.style.color = '#fff'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; e.currentTarget.style.color = '#0f172a'; }}
                                                style={{ position: 'absolute', left: '16px', top: '50%', marginTop: '-22px', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', backdropFilter: 'blur(10px)', boxShadow: '0 8px 20px rgba(0,0,0,0.18)' }}>
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                                            </button>
                                            <button className="infra-slide-btn" onClick={goNextImg}
                                                onMouseEnter={e => { e.currentTarget.style.background = tc.primary; e.currentTarget.style.color = '#fff'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; e.currentTarget.style.color = '#0f172a'; }}
                                                style={{ position: 'absolute', right: '16px', top: '50%', marginTop: '-22px', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', backdropFilter: 'blur(10px)', boxShadow: '0 8px 20px rgba(0,0,0,0.18)' }}>
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                                            </button>
                                            <div style={{ position: 'absolute', bottom: '16px', right: '16px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '12px', fontWeight: 600, letterSpacing: '0.03em', backdropFilter: 'blur(10px)' }}>
                                                {activeImgIdx + 1} / {images.length}
                                            </div>
                                        </>
                                    )}
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
                            <h2 style={{ fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', marginBottom: '1.5rem', fontStyle: activeCat.headingItalic ? 'italic' : 'normal' }}>
                                {activeCat.heading || activeCat.name}
                            </h2>
                            {activeCat.description && (
                                <div className="rte-content" style={{ fontSize: '15.5px', color: '#475569', lineHeight: 1.9 }}
                                    dangerouslySetInnerHTML={{ __html: activeCat.description }} />
                            )}
                        </Reveal>
                        <div style={{ clear: 'both' }}></div>
                    </div>
                </div>

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

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default InfrastructurePublic;