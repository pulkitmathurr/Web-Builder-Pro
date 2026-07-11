import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import { getThemeColors } from "../../constants/publicNav";

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

const SchoolLevelPublic = () => {
    const { slug, levelSlug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [allLevels, setAllLevels] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [contactIndex, setContactIndex] = useState(0);

    const levelInfo = LEVEL_MAP[levelSlug];

    useEffect(() => {
        fetchData();
        setGalleryIndex(0);
        setContactIndex(0);
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
    const navbarSolid = scrollY > 60;

    const data = allLevels?.[levelInfo.key];
    const enabledLevels = allLevels ? Object.entries(LEVEL_MAP).filter(([slug2, info]) => allLevels[info.key]?.enabled) : [];

    if (!data || !data.enabled) return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'system-ui, sans-serif' }}>
            <p style={{ fontSize: '18px', color: '#64748b' }}>This page is not available</p>
            <button onClick={() => navigate(`/school/${slug}`)}
                style={{ padding: '12px 28px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                ← Back to Home
            </button>
        </div>
    );

    const gallery = data.gallery || [];
    const contacts = (data.contacts || []).filter(c => c.name);

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
                body { background: #ffffff; }
                .gallery-arrow { transition: all 0.2s; }
                .gallery-arrow:hover { background: ${tc.primary} !important; color: #fff !important; transform: scale(1.1); }
                .contact-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
                .contact-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                .rte-content p { margin-bottom: 0.8em; }
                .rte-content p:last-child { margin-bottom: 0; }
                .rte-content strong { font-weight: 700; }
                .rte-content em { font-style: italic; }
                .rte-content u { text-decoration: underline; }
                .rte-content ul, .rte-content ol { padding-left: 1.5em; margin-bottom: 0.8em; }
                .rte-content .ql-size-small { font-size: 0.75em; }
.rte-content .ql-size-large { font-size: 1.5em; }
.rte-content .ql-size-huge { font-size: 2.5em; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="courses" />

                {/* ── Full Screen Banner ── */}
                <div style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
                    {data.bannerImage ? (
                        <img src={data.bannerImage} alt={levelInfo.label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${tc.dark},${tc.primary})` }}></div>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.5))' }}></div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 2rem' }}>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: '22px', fontWeight: 600 }}>
                            {school.name}
                        </p>
                        <h1 style={{
                            fontFamily: "'Playfair Display', Georgia, serif",
                            fontSize: 'clamp(52px,8vw,120px)', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1.05,
                            color: '#ffffff', textShadow: '0 4px 40px rgba(0,0,0,0.35)',
                        }}>
                            {levelInfo.label}
                        </h1>
                        <div style={{ width: '70px', height: '2px', background: 'rgba(255,255,255,0.6)', margin: '28px 0' }}></div>
                        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.05em', maxWidth: '480px', lineHeight: 1.7 }}>
                            Shaping minds, building character
                        </p>
                    </div>
                    <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)' }}>
                        <svg width="22" height="22" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                    </div>
                </div>

                {/* ── About — 40 (image) / 60 (text) ── */}
                {(data.aboutHeading || data.aboutQuote) && (
                    <div style={{ padding: '7rem 5rem', background: '#ffffff' }}>
                        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'grid', gridTemplateColumns: data.aboutImage ? '40% 60%' : '1fr', gap: '4rem', alignItems: 'center' }}>
                            {data.aboutImage && (
                                <Reveal>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '-12px', left: '-12px', width: '56px', height: '56px', borderTop: `3px solid ${tc.primary}`, borderLeft: `3px solid ${tc.primary}`, borderRadius: '16px 0 0 0' }}></div>
                                        <div style={{ position: 'absolute', bottom: '-12px', right: '-12px', width: '56px', height: '56px', borderBottom: `3px solid ${tc.primary}`, borderRight: `3px solid ${tc.primary}`, borderRadius: '0 0 16px 0' }}></div>
                                        <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.22), 0 10px 24px rgba(0,0,0,0.08)' }}>
                                            <img src={data.aboutImage} alt="" style={{ width: '100%', height: '560px', objectFit: 'cover', display: 'block' }} />
                                        </div>
                                    </div>
                                </Reveal>
                            )}
                            <Reveal delay={0.2}>
                                <div>
                                    <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '20px' }}>#{school.name.replace(/\s+/g, '').slice(0,12)}</p>
                                    {data.aboutHeading && (
                                        <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-1.5px', lineHeight: 1.15, marginBottom: '1.5rem', fontStyle: data.aboutHeadingItalic ? 'italic' : 'normal' }}>
                                            "{data.aboutHeading}"
                                        </h2>
                                    )}
                                    {data.aboutQuote && (
                                        <div style={{ borderLeft: `3px solid ${tc.primary}`, paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                                            <div className="rte-content" style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.9, overflowWrap: 'break-word' }}
                                                dangerouslySetInnerHTML={{ __html: data.aboutQuote }} />
                                        </div>
                                    )}
                                    {data.aboutAuthor && (
                                        <p style={{ fontSize: '15px', color: '#0f172a', fontWeight: 600 }}>
                                            — {data.aboutAuthor}{data.aboutAuthorDesignation && <span style={{ color: '#94a3b8', fontWeight: 400 }}>, {data.aboutAuthorDesignation}</span>}
                                        </p>
                                    )}
                                </div>
                            </Reveal>
                        </div>
                    </div>
                )}

                {/* ── Why Unique — 60 (text) / 40 (image) ── */}
                {(data.uniqueHeading || data.uniqueText) && (
                    <div style={{ padding: '7rem 5rem', background: tc.light }}>
                        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'grid', gridTemplateColumns: data.uniqueImage ? '60% 40%' : '1fr', gap: '4rem', alignItems: 'center' }}>
                            <Reveal>
                                <div>
                                    <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '20px' }}>What Sets Us Apart</p>
                                    {data.uniqueHeading && (
                                        <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-1.5px', lineHeight: 1.15, marginBottom: '1.5rem', fontStyle: data.uniqueHeadingItalic ? 'italic' : 'normal' }}>
                                            {data.uniqueHeading}
                                        </h2>
                                    )}
                                    {data.uniqueText && (
                                        <div style={{ borderLeft: `3px solid ${tc.primary}`, paddingLeft: '1.5rem' }}>
                                            <div className="rte-content" style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.9, overflowWrap: 'break-word' }}
                                                dangerouslySetInnerHTML={{ __html: data.uniqueText }} />
                                        </div>
                                    )}
                                </div>
                            </Reveal>
                            {data.uniqueImage && (
                                <Reveal delay={0.2}>
                                    <div style={{ position: 'relative', padding: '10px', background: '#ffffff', borderRadius: '20px', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.18), 0 10px 24px rgba(0,0,0,0.06)', border: `1px solid ${tc.primary}20` }}>
                                        <div style={{ borderRadius: '14px', overflow: 'hidden' }}>
                                            <img src={data.uniqueImage} alt="" style={{ width: '100%', height: '480px', objectFit: 'cover', display: 'block' }} />
                                        </div>
                                    </div>
                                </Reveal>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Gallery ── */}
                {gallery.length > 0 && (
                    <div style={{ padding: '7rem 5rem', background: '#ffffff', position: 'relative' }}>
                        <Reveal>
                            <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
                                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                                    <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '14px' }}>Campus Life</p>
                                    <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1.5px' }}>{levelInfo.label} Gallery</h2>
                                </div>

                                <div style={{ padding: '12px', background: '#ffffff', borderRadius: '28px', border: '1px solid #f1f5f9', boxShadow: '0 30px 70px -20px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.06)' }}>
                                    <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden' }}>
                                        <img src={gallery[galleryIndex]} alt="" style={{ width: '100%', height: '600px', objectFit: 'cover', display: 'block', transition: 'opacity 0.3s' }} />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px', background: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.35))', pointerEvents: 'none' }}></div>

                                        {gallery.length > 1 && (
                                            <>
                                                <button className="gallery-arrow" onClick={() => setGalleryIndex(p => p === 0 ? gallery.length - 1 : p - 1)}
                                                    style={{ position: 'absolute', left: '20px', top: '50%', marginTop: '-25px', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', backdropFilter: 'blur(10px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                                                </button>
                                                <button className="gallery-arrow" onClick={() => setGalleryIndex(p => p === gallery.length - 1 ? 0 : p + 1)}
                                                    style={{ position: 'absolute', right: '20px', top: '50%', marginTop: '-25px', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', backdropFilter: 'blur(10px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                                                </button>
                                                <div style={{ position: 'absolute', bottom: '18px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
                                                    {gallery.map((_, i) => (
                                                        <div key={i} onClick={() => setGalleryIndex(i)} style={{ width: i === galleryIndex ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i === galleryIndex ? '#ffffff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.3s' }}></div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                )}

                {/* ── Contacts ── */}
                {contacts.length > 0 && (
                    <div style={{ padding: '7rem 5rem', background: '#ffffff' }}>
                        <div style={{ maxWidth: '1300px', margin: '0 auto', position: 'relative' }}>
                            <Reveal>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 480px', gap: '4rem', alignItems: 'flex-start' }}>

                                    {/* Left — Heading + Info */}
                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                                        <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '20px' }}>#{school.name.replace(/\s+/g, '').slice(0,12)}</p>
                                        <h2 style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-2px', lineHeight: 1.05, textTransform: 'uppercase', marginBottom: '24px' }}>
                                            {levelInfo.label}<br />Contacts
                                        </h2>
                                        {school.phone && (
                                            <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '2rem' }}>{levelInfo.label} Reception: {school.phone}</p>
                                        )}

                                        {contacts.length > 1 && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: 'auto' }}>
                                                <button className="gallery-arrow" onClick={() => setContactIndex(p => p === 0 ? contacts.length - 1 : p - 1)}
                                                    style={{ width: '46px', height: '46px', borderRadius: '50%', background: tc.light, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tc.primary }}>
                                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                                                </button>
                                                <button className="gallery-arrow" onClick={() => setContactIndex(p => p === contacts.length - 1 ? 0 : p + 1)}
                                                    style={{ width: '46px', height: '46px', borderRadius: '50%', background: tc.light, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tc.primary }}>
                                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                                                </button>
                                                <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
                                                    {contacts.map((_, idx) => (
                                                        <div key={idx} onClick={() => setContactIndex(idx)} style={{ width: idx === contactIndex ? '20px' : '7px', height: '7px', borderRadius: '4px', background: idx === contactIndex ? tc.primary : '#e2e8f0', cursor: 'pointer', transition: 'all 0.3s' }}></div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right — Active contact's photo + info */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <div style={{ width: '100%', marginBottom: '1.5rem', position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: '-12px', left: '-12px', width: '52px', height: '52px', borderTop: `3px solid ${tc.primary}`, borderLeft: `3px solid ${tc.primary}`, borderRadius: '16px 0 0 0', zIndex: 1 }}></div>
                                            <div style={{ position: 'absolute', bottom: '-12px', right: '-12px', width: '52px', height: '52px', borderBottom: `3px solid ${tc.primary}`, borderRight: `3px solid ${tc.primary}`, borderRadius: '0 0 16px 0', zIndex: 1 }}></div>
                                            <div style={{
                                                position: 'relative', height: '420px', borderRadius: '20px', overflow: 'hidden',
                                                background: `linear-gradient(160deg, ${tc.light}, #ffffff)`,
                                                boxShadow: '0 30px 60px -15px rgba(0,0,0,0.2), 0 10px 24px rgba(0,0,0,0.06)',
                                                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                                            }}>
                                                {contacts[contactIndex].photo ? (
                                                    <img src={contacts[contactIndex].photo} alt={contacts[contactIndex].name} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', display: 'block' }} />
                                                ) : (
                                                    <span style={{ fontSize: '64px', opacity: 0.3, marginBottom: '2rem' }}>👤</span>
                                                )}
                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '90px', background: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.06))', pointerEvents: 'none' }}></div>
                                            </div>
                                        </div>
                                        {contacts[contactIndex].designation && (
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', background: tc.primary, padding: '4px 10px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', display: 'inline-block' }}>
                                                {contacts[contactIndex].designation}
                                            </span>
                                        )}
                                        <p style={{ fontSize: '30px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1.1, textTransform: 'uppercase', marginBottom: '16px' }}>
                                            {contacts[contactIndex].name}
                                        </p>
                                        {contacts[contactIndex].email && (
                                            <a href={`mailto:${contacts[contactIndex].email}`} style={{ fontSize: '18px', fontWeight: 600, color: tc.primary, textDecoration: 'none', marginBottom: '8px' }}>
                                                {contacts[contactIndex].email}
                                            </a>
                                        )}
                                        {contacts[contactIndex].phone && (
                                            <a href={`tel:${contacts[contactIndex].phone}`} style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', textDecoration: 'none' }}>
                                                {contacts[contactIndex].phone}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </Reveal>
                        </div>
                    </div>
                )}

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default SchoolLevelPublic;