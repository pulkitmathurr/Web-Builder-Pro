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
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.15 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return [ref, visible];
};

const Reveal = ({ children, delay = 0, style = {} }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(40px)',
            transition: `opacity 0.8s ease ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
            ...style
        }}>
            {children}
        </div>
    );
};

// Shared section wrapper — every section uses the SAME max-width + the SAME
// flexbox-centering mechanism, so nothing ever drifts left/right relative
// to anything else on the page.
const SectionWrap = ({ children, maxWidth = '1080px', style = {} }) => (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', position: 'relative', zIndex: 1, ...style }}>
        <div style={{ width: '100%', maxWidth }}>{children}</div>
    </div>
);

const AchievementsPublic = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const [certModal, setCertModal] = useState(null);
    const [modalZoom, setModalZoom] = useState(1);

    useEffect(() => {
        fetchData();
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [slug]);

    const fetchData = async () => {
        try {
            const res = await getPublicSchoolApi(slug);
            setSchool(res.data);
            if (res.data?.id) {
                const contentRes = await getPublicModuleContentApi(res.data.id, 'achievements');
                setContent(contentRes.data);
            }
        } catch (e) {
            navigate('/school-not-found');
        } finally {
            setLoading(false);
        }
    };

    // Card click → open the full modal directly (no card-flip animation)
    const handleCertClick = (c) => {
        setCertModal(c);
        setModalZoom(1);
    };

    const closeCertModal = () => {
        setCertModal(null);
        setModalZoom(1);
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '48px', height: '48px', border: '3px solid #f0c4c4', borderTop: '3px solid #8b2252', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!school) return null;

    const tc = getThemeColors(school.theme);

    if (!content) {
        return (
            <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: "'Inter', system-ui, sans-serif" }}>
                <p style={{ fontSize: '20px', color: '#64748b' }}>Achievements page not published yet</p>
                <button onClick={() => navigate(`/school/${slug}`)}
                    style={{ padding: '12px 28px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    ← Back to Home
                </button>
            </div>
        );
    }

    const achievements = content.achievements || [];
    const certifications = (content.certifications || []).filter(c => c.image || c.title);

    const parallaxOffset = Math.min(scrollY * 0.4, 200);

    return (
    <>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700;1,800&display=swap" rel="stylesheet" />
        <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes float3d { 0%,100% { transform: translateY(0) rotateX(0deg); } 50% { transform: translateY(-10px) rotateX(2deg); } }
                @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 30px ${tc.primary}25; } 50% { box-shadow: 0 0 50px ${tc.secondary}35; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalPop { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
                body { background: #ffffff; }
                .premium-heading {
                    font-family: 'Playfair Display', Georgia, serif;
                    font-style: italic;
                    font-weight: 700;
                }
                .cert-card { cursor: pointer; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease; }
                .cert-card:hover { transform: translateY(-10px); box-shadow: 0 30px 60px rgba(0,0,0,0.1); }
                .rte-content p { margin-bottom: 0.8em; }
                .rte-content p:last-child { margin-bottom: 0; }
                .rte-content strong { font-weight: 700; }
                .rte-content em { font-style: italic; }
                .rte-content u { text-decoration: underline; }
                .rte-content ul, .rte-content ol { padding-left: 1.5em; margin-bottom: 0.8em; }
                .rte-content .ql-size-small { font-size: 0.75em; }
                .rte-content .ql-size-large { font-size: 1.5em; }
                .rte-content .ql-size-huge { font-size: 2.5em; }
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}; border-radius: 4px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', color: '#0f172a', overflowX: 'hidden' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="achievements" />

                {/* ── Hero Banner — height & parallax mechanics unchanged ── */}
                <div style={{ height: '90vh', position: 'relative', overflow: 'hidden' }}>
                    {content.banner ? (
                        <img src={content.banner} alt="Achievements"
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
                            fontSize: 'clamp(48px, 8vw, 110px)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1,
                            color: '#ffffff', textShadow: '0 4px 30px rgba(0,0,0,0.3)',
                            opacity: Math.max(1 - scrollY / 400, 0), transform: `translateY(${scrollY * 0.2}px)`,
                            fontStyle: content.headingItalic ? 'italic' : 'normal',
                        }}>
                            {content.heading || 'Achievements'}
                        </h1>
                    </div>

                    <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', opacity: Math.max(1 - scrollY / 150, 0) }}>
                        <svg width="22" height="22" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" viewBox="0 0 24 24" style={{ animation: 'float3d 2s ease-in-out infinite' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                </div>

                {/* ── Header + Description — left-aligned, breadcrumb + two-tone heading ── */}
                <div style={{ padding: '5rem 3rem 4rem', background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
                    <SectionWrap>
                        <div>
                            <Reveal>
                                {/* Breadcrumb pill */}
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    border: `1.5px solid ${tc.primary}`, borderRadius: '999px',
                                    padding: '7px 18px', marginBottom: '24px'
                                }}>
                                    <span onClick={() => navigate(`/school/${slug}`)} style={{ fontSize: '11px', fontWeight: 700, color: tc.primary, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
                                        Home
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>/</span>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                        Awards &amp; Achievements
                                    </span>
                                </div>

                                {/* Two-tone heading, left-aligned, bold sans-serif */}
                                <h2 style={{
                                    fontFamily: "'Inter', system-ui, sans-serif",
                                    fontSize: 'clamp(32px,4.5vw,48px)', fontWeight: 800, letterSpacing: '-1px',
                                    lineHeight: 1.15, marginBottom: '1.5rem', color: '#0f172a'
                                }}>
                                    Awards &amp; <span style={{ color: tc.primary }}>Achievements</span>
                                </h2>
                            </Reveal>
                            <Reveal delay={0.15}>
                                {content.description && (
                                    <div style={{ borderLeft: `3px solid ${tc.primary}`, paddingLeft: '1.5rem', maxWidth: '760px' }}>
                                        <div className="rte-content" style={{ fontSize: '15px', color: '#475569', lineHeight: 1.85, textAlign: 'left', overflowWrap: 'break-word' }}
                                            dangerouslySetInnerHTML={{ __html: content.description }} />
                                    </div>
                                )}
                            </Reveal>
                        </div>
                    </SectionWrap>
                </div>

                {/* ── Achievement Entries ── */}
                {achievements.map((a, i) => (
                    <div key={a.id} style={{ padding: '6.5rem 3rem', background: i % 2 === 0 ? tc.light : '#ffffff', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                        <SectionWrap style={{ padding: 0 }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: a.photo ? 'minmax(280px, 400px) minmax(0, 1fr)' : '1fr',
                                gap: '4rem', alignItems: 'center',
                                margin: '0 auto'
                            }}>

                                {a.photo && (
                                    <Reveal>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{
                                                position: 'absolute', inset: '-16px', borderRadius: '28px',
                                                background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`,
                                                opacity: 0.18, filter: 'blur(22px)', animation: 'pulse-glow 4s ease-in-out infinite'
                                            }}></div>
                                            <img src={a.photo} alt={a.name}
                                                style={{ width: '100%', height: '440px', objectFit: 'cover', borderRadius: '22px', position: 'relative', zIndex: 1, boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }} />

                                            {a.year && (
                                                <div style={{
                                                    position: 'absolute', top: '-18px', left: '24px', zIndex: 2,
                                                    background: '#ffffff', borderRadius: '999px',
                                                    padding: '8px 18px', boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
                                                    border: `1px solid ${tc.primary}20`
                                                }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 800, color: tc.primary, letterSpacing: '0.08em' }}>{a.year}</span>
                                                </div>
                                            )}
                                        </div>
                                    </Reveal>
                                )}

                                <Reveal delay={a.photo ? 0.2 : 0} style={{ minWidth: 0 }}>
                                    <div style={{ textAlign: a.photo ? 'left' : 'center', maxWidth: a.photo ? 'none' : '760px', margin: a.photo ? 0 : '0 auto' }}>
                                        <svg width="40" height="40" fill={tc.primary} viewBox="0 0 24 24"
                                            style={{ marginBottom: '1.25rem', opacity: 0.45, marginLeft: a.photo ? 0 : 'auto', marginRight: a.photo ? 0 : 'auto', display: a.photo ? 'block' : 'inline-block' }}>
                                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                                        </svg>

                                        {a.category && (
                                            <p style={{ fontSize: '11.5px', color: tc.primary, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 700 }}>
                                                {a.category}
                                            </p>
                                        )}

                                        {a.title && (
                                            <h3 style={{ fontSize: 'clamp(24px,3vw,32px)', fontWeight: 800, color: '#0f172a', marginBottom: '1.1rem', letterSpacing: '-0.5px', lineHeight: 1.25 }}>
                                                {a.title}
                                            </h3>
                                        )}

                                        {a.quote && (
                                            <div style={a.photo ? { borderLeft: `3px solid ${tc.primary}`, paddingLeft: '1.25rem', marginBottom: '1.5rem' } : { marginBottom: '1.5rem' }}>
                                                <div className="rte-content" style={{ fontSize: '16.5px', color: '#3f4a61', lineHeight: 1.85, fontStyle: 'italic', overflowWrap: 'break-word' }}
                                                    dangerouslySetInnerHTML={{ __html: a.quote }} />
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '1.75rem', paddingTop: '1.4rem', borderTop: '1px solid #e2e8f0', justifyContent: a.photo ? 'flex-start' : 'center' }}>
                                            <div style={{ width: '3px', height: '36px', background: `linear-gradient(180deg,${tc.primary},${tc.secondary})`, borderRadius: '2px' }}></div>
                                            <div style={{ textAlign: 'left' }}>
                                                <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{a.name}</p>
                                                {a.designation && <p style={{ fontSize: '12.5px', color: tc.primary, marginTop: '2px' }}>{a.designation}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </Reveal>
                            </div>
                        </SectionWrap>
                    </div>
                ))}

                {/* ── Certifications — click a card to open it in the modal ── */}
                {certifications.length > 0 && (
                    <div style={{ padding: '7rem 3rem', background: '#fafafa' }}>
                        <SectionWrap>
                            <Reveal>
                                <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                                    <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 700 }}>Recognitions</p>
                                    <h2 className="premium-heading" style={{ fontSize: '48px', color: '#0f172a', letterSpacing: '-0.5px' }}>Certifications</h2>
                                </div>
                            </Reveal>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                                {certifications.map((c, i) => (
                                    <Reveal key={c.id} delay={i * 0.08}>
                                        <div className="cert-card" onClick={() => handleCertClick(c)}
                                            style={{ height: '220px', borderRadius: '20px', overflow: 'hidden', background: '#ffffff', border: '1px solid #f1f5f9', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                                            {c.image && (
                                                <div style={{ flex: 1, background: tc.light, overflow: 'hidden' }}>
                                                    <img src={c.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            )}
                                            <div style={{ padding: '1rem' }}>
                                                {c.title && <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{c.title}</p>}
                                            </div>
                                        </div>
                                    </Reveal>
                                ))}
                            </div>
                        </SectionWrap>
                    </div>
                )}

                {/* ── Certificate Modal (opens after flip) ── */}
                {certModal && (
                    <div onClick={closeCertModal}
                        style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', animation: 'fadeIn 0.25s ease' }}>

                        <div onClick={e => e.stopPropagation()}
                            style={{
                                position: 'relative', width: '100%', maxWidth: '640px', maxHeight: '88vh',
                                background: '#ffffff', borderRadius: '20px', overflow: 'hidden',
                                display: 'flex', flexDirection: 'column',
                                boxShadow: '0 30px 90px rgba(0,0,0,0.5)', animation: 'modalPop 0.3s cubic-bezier(0.16,1,0.3,1)'
                            }}>

                            {/* Image with zoom */}
                            {certModal.image && (
                                <div style={{ position: 'relative', width: '100%', height: '360px', overflow: 'hidden', background: '#0f172a' }}>
                                    <img src={certModal.image} alt=""
                                        style={{
                                            width: '100%', height: '100%', objectFit: 'contain',
                                            transform: `scale(${modalZoom})`, transition: 'transform 0.25s ease'
                                        }} />
                                </div>
                            )}

                            {/* Zoom controls — stopPropagation so clicks don't bubble up and close the modal */}
                            <div onClick={e => e.stopPropagation()}
                                style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '1rem 0', background: '#0f172a' }}>
                                <button onClick={() => setModalZoom(z => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))}
                                    style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', cursor: 'pointer', fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    −
                                </button>
                                <button onClick={() => setModalZoom(1)}
                                    style={{ padding: '0 16px', height: '38px', borderRadius: '19px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>
                                    Reset
                                </button>
                                <button onClick={() => setModalZoom(z => Math.min(3, parseFloat((z + 0.25).toFixed(2))))}
                                    style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', cursor: 'pointer', fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    +
                                </button>
                            </div>

                            {/* Description — black text, white background, premium italic font */}
                            <div style={{ padding: '1.75rem 2.25rem 2.25rem', overflowY: 'auto' }}>
                                {certModal.title && (
                                    <h3 className="premium-heading" style={{ fontSize: '24px', color: '#0f172a', marginBottom: '0.9rem', letterSpacing: '-0.3px' }}>
                                        {certModal.title}
                                    </h3>
                                )}
                                {certModal.info && (
                                    <p style={{
                                        fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic',
                                        fontSize: '16.5px', lineHeight: 1.8, color: '#0f172a'
                                    }}>
                                        {certModal.info}
                                    </p>
                                )}
                            </div>

                            <button onClick={closeCertModal}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: '1px solid #e2e8f0', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default AchievementsPublic;