import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import { getThemeColors } from "../../constants/publicNav";

const LEVEL_LABELS = {
    primary: 'Primary School Faculty',
    middle: 'Middle School Faculty',
    high: 'High School Faculty',
    senior: 'Senior School Faculty',
    general: 'General Faculty',
};

const LEVEL_ORDER = ['primary', 'middle', 'high', 'senior', 'general'];

const useScrollReveal = () => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.12 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, visible];
};

const Reveal = ({ children, delay = 0, style = {} }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(36px)', transition: `opacity 0.75s ease ${delay}s, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>
            {children}
        </div>
    );
};

// ── Single level section — active profile + thumbnail carousel ──
const BIO_CLAMP_HEIGHT = 210;

const LevelSection = ({ levelKey, members, tc }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [carouselStart, setCarouselStart] = useState(0);
    const [bioExpanded, setBioExpanded] = useState(false);
    const active = members[activeIndex];
    const visibleThumbs = members.slice(carouselStart, carouselStart + 4);

    const canGoBack = carouselStart > 0;
    const canGoForward = carouselStart + 4 < members.length;

    const selectMember = (idx) => {
        setActiveIndex(idx);
        setBioExpanded(false);
    };

    return (
        <div style={{ padding: '5rem 5rem', background: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
                <Reveal>
                    <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2.5rem' }}>{LEVEL_LABELS[levelKey]}</p>
                </Reveal>

                {/* Active profile */}
                <Reveal delay={0.1}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '3.5rem', alignItems: 'flex-start', marginBottom: '3rem' }}>
                        {/* Left — info */}
                        <div style={{ paddingTop: '1rem' }}>
                            {active.designation && (
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', background: tc.primary, padding: '4px 10px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px', display: 'inline-block' }}>
                                    {active.designation}
                                </span>
                            )}
                            <h3 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', lineHeight: 1.05, textTransform: 'uppercase', marginBottom: '16px' }}>
                                {active.name}
                            </h3>
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                                {active.qualification && <span style={{ fontSize: '13px', color: '#64748b' }}>🎓 {active.qualification}</span>}
                                {active.experience && <span style={{ fontSize: '13px', color: '#64748b' }}>📌 {active.experience}</span>}
                            </div>
                            {active.bio && (
                                <div style={{ position: 'relative', maxWidth: '560px' }}>
                                    <div className="rte-content" style={{
                                        fontSize: '14.5px', color: '#475569', lineHeight: 1.8, overflowWrap: 'break-word',
                                        maxHeight: bioExpanded ? 'none' : `${BIO_CLAMP_HEIGHT}px`,
                                        overflow: bioExpanded ? 'visible' : 'hidden',
                                    }}
                                        dangerouslySetInnerHTML={{ __html: active.bio }} />
                                    {!bioExpanded && (
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50px', background: 'linear-gradient(180deg, rgba(255,255,255,0), #ffffff)', pointerEvents: 'none' }}></div>
                                    )}
                                </div>
                            )}
                            {active.bio && (
                                <button onClick={() => setBioExpanded(v => !v)}
                                    style={{ marginTop: '14px', padding: '9px 20px', background: 'transparent', color: tc.primary, border: `1.5px solid ${tc.primary}`, borderRadius: '8px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = tc.primary; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = tc.primary; }}>
                                    {bioExpanded ? 'Show Less ↑' : 'Read More ↓'}
                                </button>
                            )}
                        </div>

                        {/* Right — photo, framed to line up with the name (not the designation badge) above it */}
                        <div style={{ paddingTop: active.designation ? '3.25rem' : '1rem' }}>
                            <div style={{ position: 'relative' }}>
                                {/* Viewfinder-style corner accents */}
                                <div style={{ position: 'absolute', top: '-12px', left: '-12px', width: '54px', height: '54px', borderTop: `3px solid ${tc.primary}`, borderLeft: `3px solid ${tc.primary}`, borderRadius: '16px 0 0 0' }}></div>
                                <div style={{ position: 'absolute', bottom: '-12px', right: '-12px', width: '54px', height: '54px', borderBottom: `3px solid ${tc.primary}`, borderRight: `3px solid ${tc.primary}`, borderRadius: '0 0 16px 0' }}></div>

                                <div style={{
                                    position: 'relative', height: '380px', borderRadius: '20px', overflow: 'hidden',
                                    background: `linear-gradient(160deg, ${tc.light}, #ffffff)`,
                                    boxShadow: '0 30px 60px -15px rgba(0,0,0,0.2), 0 10px 24px rgba(0,0,0,0.06)',
                                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                                }}>
                                    {active.photo ? (
                                        <img src={active.photo} alt={active.name} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', display: 'block' }} />
                                    ) : (
                                        <span style={{ fontSize: '56px', opacity: 0.3, marginBottom: '2rem' }}>👤</span>
                                    )}
                                    {/* Subtle bottom gradient for a premium, editorial finish */}
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '90px', background: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.06))', pointerEvents: 'none' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Reveal>

                {/* Carousel of small cards */}
                <Reveal delay={0.2}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <button onClick={() => setCarouselStart(p => Math.max(0, p - 4))} disabled={!canGoBack}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', background: canGoBack ? tc.light : '#f8fafc', border: 'none', cursor: canGoBack ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: canGoBack ? tc.primary : '#cbd5e1', flexShrink: 0 }}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', flex: 1 }}>
                            {visibleThumbs.map((m, idx) => {
                                const realIndex = carouselStart + idx;
                                const isActive = realIndex === activeIndex;
                                return (
                                    <div key={m.id} onClick={() => selectMember(realIndex)}
                                        style={{
                                            cursor: 'pointer', borderRadius: '14px', overflow: 'hidden',
                                            border: isActive ? `2px solid ${tc.primary}` : '1px solid #f1f5f9',
                                            background: '#ffffff', transition: 'all 0.2s',
                                            display: 'flex', flexDirection: 'column', aspectRatio: '1',
                                            boxShadow: isActive ? `0 8px 20px ${tc.primary}25` : '0 2px 8px rgba(0,0,0,0.04)',
                                        }}>
                                        {/* Square image area — 85% */}
                                        <div style={{ flex: '0 0 85%', background: tc.light, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {m.photo ? (
                                                <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ fontSize: '32px', opacity: 0.3 }}>👤</span>
                                            )}
                                        </div>
                                        {/* Connected rectangle — name + designation */}
                                        <div style={{ flex: '0 0 15%', background: isActive ? tc.primary : '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 6px', minHeight: '50px' }}>
                                            <p style={{ fontSize: '11px', fontWeight: 700, color: isActive ? '#ffffff' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', lineHeight: 1.2 }}>{m.name}</p>
                                            {m.designation && (
                                                <p style={{ fontSize: '9px', color: isActive ? 'rgba(255,255,255,0.7)' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', marginTop: '2px' }}>{m.designation}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {/* Fill empty slots to keep grid consistent */}
                            {visibleThumbs.length < 4 && Array.from({ length: 4 - visibleThumbs.length }).map((_, i) => (
                                <div key={`empty-${i}`}></div>
                            ))}
                        </div>

                        <button onClick={() => setCarouselStart(p => p + 4)} disabled={!canGoForward}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', background: canGoForward ? tc.light : '#f8fafc', border: 'none', cursor: canGoForward ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: canGoForward ? tc.primary : '#cbd5e1', flexShrink: 0 }}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                        </button>
                    </div>
                </Reveal>
            </div>
        </div>
    );
};

const FacultyPublic = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const [bannerIndex, setBannerIndex] = useState(0);

    useEffect(() => {
        fetchData();
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [slug]);

    useEffect(() => {
        if (!content?.banners?.length || content.banners.length <= 1) return;
        const timer = setInterval(() => {
            setBannerIndex(p => (p + 1) % content.banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [content]);

    const fetchData = async () => {
        try {
            const res = await getPublicSchoolApi(slug);
            setSchool(res.data);
            if (res.data?.id) {
                const contentRes = await getPublicModuleContentApi(res.data.id, 'faculty');
                if (contentRes.data?.members?.length > 0) setContent(contentRes.data);
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
            <p style={{ fontSize: '18px', color: '#64748b' }}>Faculty page not published yet</p>
            <button onClick={() => navigate(`/school/${slug}`)}
                style={{ padding: '12px 28px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                ← Back to Home
            </button>
        </div>
    );

    // Group members by level
    const grouped = {};
    content.members.forEach(m => {
        const lvl = m.level || 'general';
        if (!grouped[lvl]) grouped[lvl] = [];
        grouped[lvl].push(m);
    });
    const activeLevels = LEVEL_ORDER.filter(lvl => grouped[lvl] && grouped[lvl].length > 0);

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                body { background: #ffffff; }
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
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="faculty" />

                {/* ── Hero Banner — full screen with rotating images ── */}
                <div style={{ height: '90vh', position: 'relative', overflow: 'hidden' }}>
                    {content.banners && content.banners.length > 0 ? (
                        content.banners.map((img, i) => (
                            <img key={i} src={img} alt=""
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === bannerIndex ? 1 : 0, transition: 'opacity 1s ease' }} />
                        ))
                    ) : (
                        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${tc.dark},${tc.primary})` }}></div>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.35) 60%, #ffffff 100%)' }}></div>

                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 2rem' }}>
                        <p style={{ fontSize: '13px', color: '#fff', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '20px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                            {school.name}
                        </p>
                        <h1 style={{ fontSize: 'clamp(48px, 8vw, 110px)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1, color: '#ffffff', textShadow: '0 4px 30px rgba(0,0,0,0.3)' }}>
                            Our Faculty
                        </h1>
                    </div>

                    {/* Carousel arrows + dots */}
                    {content.banners && content.banners.length > 1 && (
                        <>
                            <button onClick={() => setBannerIndex(p => p === 0 ? content.banners.length - 1 : p - 1)}
                                style={{ position: 'absolute', left: '30px', top: '50%', transform: 'translateY(-50%)', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', backdropFilter: 'blur(8px)' }}>
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                            </button>
                            <button onClick={() => setBannerIndex(p => (p + 1) % content.banners.length)}
                                style={{ position: 'absolute', right: '30px', top: '50%', transform: 'translateY(-50%)', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', backdropFilter: 'blur(8px)' }}>
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                            </button>
                            <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
                                {content.banners.map((_, i) => (
                                    <div key={i} onClick={() => setBannerIndex(i)} style={{ width: i === bannerIndex ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i === bannerIndex ? '#ffffff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.3s' }}></div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div style={{ textAlign: 'center', padding: '3rem 5rem 0', background: '#ffffff' }}>
                    <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '500px', margin: '0 auto' }}>Meet the educators who inspire and guide our students every day</p>
                </div>

                {/* ── Level-wise sections ── */}
                {activeLevels.map(levelKey => (
                    <LevelSection key={levelKey} levelKey={levelKey} members={grouped[levelKey]} tc={tc} />
                ))}

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default FacultyPublic;