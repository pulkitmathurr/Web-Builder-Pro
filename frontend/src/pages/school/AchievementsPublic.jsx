import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { getFontFamily } from "../../constants/fonts";

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
    const bc = getBaseColors(school.base_theme);

    if (!isModuleEnabled(school, 'achievements')) return <NotPublished tc={tc} slug={slug} label="Achievements" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Achievements" />;

    const achievements = content.achievements || [];
    const certifications = (content.certifications || []).filter(c => c.image || c.title);

    return (
    <>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700;1,800&display=swap" rel="stylesheet" />
        <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalPop { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
                body { background: ${bc.surface}; }
                .premium-heading {
                    font-family: 'Playfair Display', Georgia, serif;
                    font-style: italic;
                    font-weight: 700;
                }
                .cert-card { cursor: pointer; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease; }
                .cert-card:hover { transform: translateY(-10px); box-shadow: 0 30px 60px rgba(0,0,0,0.1); }
                .achievement-photo-card:hover .achievement-photo-img { transform: scale(1.06); }
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
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}; border-radius: 4px; }
                @media (max-width: 900px) {
                    .ach-cert-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 700px) {
                    .ach-entry-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
                }
                @media (max-width: 480px) {
                    .ach-cert-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, color: '#0f172a', overflowX: 'hidden' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="achievements" />

                {/* ── Header — no banner photo, clean gradient header (same design as About Us) ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'calc(92px + 1.6rem) clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: content.headingFont ? getFontFamily(content.headingFont) : "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: content.headingColor || '#ffffff', letterSpacing: '-1px', marginBottom: '10px', fontStyle: content.headingItalic ? 'italic' : 'normal' }}>
                            {content.heading || 'Achievements'}
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* ── Header + Description — left-aligned, breadcrumb + heading, controlled by admin's "Section Header" field ── */}
                <div style={{ padding: '3.5rem clamp(1.25rem,6vw,3rem) 2.5rem', background: bc.surface, position: 'relative', overflow: 'hidden' }}>
                    <SectionWrap>
                        <div>
                            {content.subHeading && content.subHeading.trim() && (
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
                                            {content.subHeading}
                                        </span>
                                    </div>

                                    {/* Heading, left-aligned, bold sans-serif */}
                                    <h2 style={{
                                        fontFamily: "'Inter', system-ui, sans-serif",
                                        fontSize: 'clamp(32px,4.5vw,48px)', fontWeight: 800, letterSpacing: '-1px',
                                        lineHeight: 1.15, marginBottom: '1.5rem', color: '#0f172a'
                                    }}>
                                        {content.subHeading}
                                    </h2>
                                </Reveal>
                            )}
                            <Reveal delay={0.15}>
                                {content.description && (
                                    <div style={{ position: 'relative', maxWidth: '100%' }}>
                                        <svg width="30" height="30" viewBox="0 0 24 24" fill={tc.primary} style={{ opacity: 0.12, position: 'absolute', top: '-4px', right: '0' }}>
                                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
                                        </svg>
                                        <div style={{ width: '38px', height: '3px', background: `linear-gradient(90deg,${tc.primary},${tc.secondary})`, borderRadius: '2px', marginBottom: '1.1rem' }}></div>
                                        <div className="rte-content" style={{ fontSize: '15.5px', color: '#475569', lineHeight: 1.9, textAlign: 'left', overflowWrap: 'normal', wordBreak: 'normal', position: 'relative', zIndex: 1 }}
                                            dangerouslySetInnerHTML={{ __html: content.description }} />
                                    </div>
                                )}
                            </Reveal>
                        </div>
                    </SectionWrap>
                </div>

                {/* ── Achievement Entries ── */}
                {achievements.map((a, i) => (
                    <div key={a.id} style={{ padding: '4rem clamp(1.25rem,6vw,3rem)', background: bc.surface, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                        <SectionWrap style={{ padding: 0 }}>
                            <div className="ach-entry-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: a.photo ? 'minmax(220px, 280px) minmax(0, 1fr)' : '1fr',
                                gap: '3rem', alignItems: 'center',
                                margin: '0 auto'
                            }}>

                                {a.photo && (
                                    <Reveal>
                                        <div className="achievement-photo-card" style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 18px 40px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.06)' }}>
                                            <img src={a.photo} alt={a.name}
                                                className="achievement-photo-img"
                                                style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block', transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
                                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 58%, rgba(15,23,42,0.45) 100%)', pointerEvents: 'none' }}></div>
                                            <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 0 1px ${tc.primary}25`, borderRadius: '20px', pointerEvents: 'none' }}></div>

                                            {a.year && (
                                                <div style={{
                                                    position: 'absolute', bottom: '14px', left: '14px', zIndex: 2,
                                                    background: 'rgba(255,255,255,0.96)', borderRadius: '10px',
                                                    padding: '6px 14px', boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
                                                }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 800, color: tc.primary, letterSpacing: '0.08em' }}>{a.year}</span>
                                                </div>
                                            )}
                                        </div>
                                    </Reveal>
                                )}

                                <Reveal delay={a.photo ? 0.2 : 0} style={{ minWidth: 0 }}>
                                    <div style={{ textAlign: a.photo ? 'left' : 'center', maxWidth: a.photo ? 'none' : '960px', margin: a.photo ? 0 : '0 auto' }}>
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
                                                <div className="rte-content" style={{ fontSize: '16.5px', color: '#3f4a61', lineHeight: 1.85, overflowWrap: 'normal', wordBreak: 'normal' }}
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
                    <div style={{ padding: '4rem clamp(1.25rem,6vw,3rem)', background: bc.surface }}>
                        <SectionWrap>
                            <Reveal>
                                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                                    <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 700 }}>Recognitions</p>
                                    <h2 className="premium-heading" style={{ fontSize: '48px', color: '#0f172a', letterSpacing: '-0.5px' }}>Certifications</h2>
                                </div>
                            </Reveal>
                            <div className="ach-cert-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                                {certifications.map((c, i) => (
                                    <Reveal key={c.id} delay={i * 0.08}>
                                        <div className="cert-card" onClick={() => handleCertClick(c)}
                                            style={{ height: '220px', borderRadius: '20px', overflow: 'hidden', background: bc.card, border: '1px solid #f1f5f9', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
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

                            {/* Image with zoom — sized to the certificate's own aspect ratio (capped by viewport height) so it fits without empty bars around it */}
                            {certModal.image && (
                                <div style={{ position: 'relative', width: '100%', maxHeight: '65vh', overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src={certModal.image} alt=""
                                        onClick={() => setModalZoom(z => z > 1 ? 1 : 2)}
                                        style={{
                                            display: 'block', width: '100%', height: 'auto', maxHeight: '65vh', objectFit: 'contain',
                                            transform: `scale(${modalZoom})`, transition: 'transform 0.25s ease',
                                            cursor: modalZoom > 1 ? 'zoom-out' : 'zoom-in'
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