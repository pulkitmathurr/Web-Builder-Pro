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
        const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.15 });
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

// ── Ornamental divider — arrow-tipped line with a decorative knot in the center,
// matching the reference site's separator between alumni entries ──
const OrnamentalDivider = ({ color }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', margin: '3.5rem 0' }}>
        <svg width="100%" height="20" viewBox="0 0 600 20" preserveAspectRatio="none" style={{ maxWidth: '560px' }}>
            <line x1="6" y1="10" x2="265" y2="10" stroke={color} strokeWidth="1.2" />
            <line x1="335" y1="10" x2="594" y2="10" stroke={color} strokeWidth="1.2" />
            <path d="M0 10 L10 5 L10 15 Z" fill={color} />
            <path d="M600 10 L590 5 L590 15 Z" fill={color} />
            {/* center knot — interlocking loops */}
            <g transform="translate(300,10)">
                <circle cx="-14" cy="0" r="6" fill="none" stroke={color} strokeWidth="1.3" />
                <circle cx="-5" cy="0" r="6" fill="none" stroke={color} strokeWidth="1.3" />
                <circle cx="5" cy="0" r="6" fill="none" stroke={color} strokeWidth="1.3" />
                <circle cx="14" cy="0" r="6" fill="none" stroke={color} strokeWidth="1.3" />
            </g>
        </svg>
    </div>
);

// ── Decorative jeweled pin used to "seal" the legacy scroll shut ──
const PinIcon = ({ color }) => (
    <svg width="28" height="46" viewBox="0 0 28 46" fill="none" style={{ display: 'block', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))' }}>
        <defs>
            <radialGradient id="pinGem" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                <stop offset="35%" stopColor={color} />
                <stop offset="100%" stopColor="#3d0f1f" />
            </radialGradient>
            <linearGradient id="pinGold" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b6f14" />
                <stop offset="50%" stopColor="#f4e4b8" />
                <stop offset="100%" stopColor="#c9a227" />
            </linearGradient>
        </defs>
        <circle cx="14" cy="11" r="10.5" fill="url(#pinGold)" />
        <circle cx="14" cy="11" r="7.5" fill="url(#pinGem)" />
        <ellipse cx="11" cy="7.5" rx="2.6" ry="1.8" fill="#ffffff" opacity="0.55" />
        <rect x="12" y="19" width="4" height="22" rx="2" fill="url(#pinGold)" />
        <circle cx="14" cy="42" r="3.2" fill="url(#pinGold)" />
    </svg>
);

// ── Ornamental corner flourish for the parchment frame ──
const CornerFlourish = ({ color, style }) => (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" style={{ position: 'absolute', ...style }}>
        <path d="M3 3 Q3 18 18 18" stroke={color} strokeWidth="1.3" fill="none" />
        <path d="M3 3 Q18 3 18 18" stroke={color} strokeWidth="1.3" fill="none" opacity="0.45" />
        <circle cx="3" cy="3" r="2.6" fill={color} />
        <path d="M9 3 Q13.5 3 13.5 7.5" stroke={color} strokeWidth="1" fill="none" opacity="0.6" />
        <path d="M3 9 Q3 13.5 7.5 13.5" stroke={color} strokeWidth="1" fill="none" opacity="0.6" />
    </svg>
);

// ── Royal wax-seal crest that stamps the top of the opened parchment ──
const SealCrest = ({ tc, visible }) => (
    <div style={{
        width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
        background: `radial-gradient(circle at 35% 28%, ${tc.secondary}, ${tc.primary} 55%, ${tc.dark} 100%)`,
        border: '2.5px solid #e8d09a',
        boxShadow: '0 8px 18px rgba(0,0,0,0.3), inset 0 1px 3px rgba(255,255,255,0.45), inset 0 -2px 4px rgba(0,0,0,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: visible ? 'scale(1) rotate(0deg)' : 'scale(0.3) rotate(-30deg)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.55s, opacity 0.4s ease 0.55s',
    }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f4e8c8" strokeWidth="1.4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5l2.4 5 5.6.6-4.1 3.9.98 5.6L12 14.9l-4.88 2.7.98-5.6-4.1-3.9 5.6-.6L12 2.5z" />
        </svg>
    </div>
);

// ── "Legacy" scroll — closed by a draggable jeweled pin; dragging it down and
// releasing past the threshold unseals it and a royal parchment unrolls open,
// revealing the description. Width matches the alumni card column below. ──
const LegacyScroll = ({ description, tc }) => {
    const [pulled, setPulled] = useState(false);
    const [dragY, setDragY] = useState(0);
    const [dragging, setDragging] = useState(false);
    const dragStartRef = useRef(0);

    const PULL_THRESHOLD = 65;

    const handlePointerDown = (e) => {
        if (pulled) return;
        setDragging(true);
        dragStartRef.current = e.clientY;
        e.currentTarget.setPointerCapture(e.pointerId);
    };
    const handlePointerMove = (e) => {
        if (!dragging || pulled) return;
        const delta = e.clientY - dragStartRef.current;
        setDragY(Math.max(0, Math.min(delta, 140)));
    };
    const handlePointerUp = () => {
        if (!dragging) return;
        setDragging(false);
        if (dragY > PULL_THRESHOLD) setPulled(true);
        else setDragY(0);
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
            <Reveal>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    border: `1px solid ${tc.primary}35`, borderRadius: '999px',
                    padding: '8px 20px', marginBottom: '30px'
                }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: tc.primary }}></span>
                    <span style={{ fontSize: '11px', color: tc.primary, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
                        Our Legacy
                    </span>
                </div>

                {/* Pin + rolled scroll seal */}
                <div style={{ position: 'relative', height: '58px', marginBottom: pulled ? '0px' : '6px', transition: 'margin-bottom 0.5s ease' }}>
                    {/* rolled dowel — gilded end caps + rod, splits apart once pulled */}
                    <div style={{ position: 'absolute', left: '50%', top: '17px', transform: 'translateX(-50%)', width: '100%', maxWidth: '900px', height: '18px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <div style={{
                            width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                            background: 'radial-gradient(circle at 35% 30%,#fdf2cf,#e8c874 45%,#9c7a1f 100%)',
                            boxShadow: '0 3px 8px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.6)',
                            transition: 'transform 0.8s cubic-bezier(0.34,1.56,0.64,1), opacity 0.6s ease',
                            transform: pulled ? 'translate(-140px,-4px) rotate(-25deg)' : 'translate(0,0) rotate(0deg)',
                            opacity: pulled ? 0 : 1,
                        }}></div>
                        <div style={{
                            flex: 1, height: '9px', margin: '0 -1px',
                            background: 'repeating-linear-gradient(90deg,#f3e0ac 0px,#dbb968 4px,#f3e0ac 8px)',
                            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -1px 2px rgba(120,85,20,0.35)',
                            transition: 'transform 0.6s ease, opacity 0.5s ease', transformOrigin: 'center',
                            transform: pulled ? 'scaleX(0)' : 'scaleX(1)', opacity: pulled ? 0 : 1,
                        }}></div>
                        <div style={{
                            width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                            background: 'radial-gradient(circle at 35% 30%,#fdf2cf,#e8c874 45%,#9c7a1f 100%)',
                            boxShadow: '0 3px 8px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.6)',
                            transition: 'transform 0.8s cubic-bezier(0.34,1.56,0.64,1), opacity 0.6s ease',
                            transform: pulled ? 'translate(140px,-4px) rotate(25deg)' : 'translate(0,0) rotate(0deg)',
                            opacity: pulled ? 0 : 1,
                        }}></div>
                    </div>

                    {/* Pin — drag down to unseal */}
                    <div
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        style={{
                            position: 'absolute', left: '50%', top: '0px', zIndex: 5,
                            transform: `translate(-50%, ${pulled ? 130 : dragY}px) rotate(${(pulled ? 55 : dragY) * 0.3}deg)`,
                            opacity: pulled ? 0 : 1,
                            transition: dragging ? 'none' : 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease',
                            cursor: pulled ? 'default' : (dragging ? 'grabbing' : 'grab'),
                            touchAction: 'none',
                        }}>
                        <PinIcon color={tc.primary} />
                    </div>
                </div>

                {!pulled && (
                    <p style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                        Drag the pin down to unfurl our story
                    </p>
                )}

                {/* Parchment panel — unrolls open once the pin is pulled */}
                <div style={{
                    maxHeight: pulled ? '3000px' : '0px',
                    opacity: pulled ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 1s cubic-bezier(0.22,1,0.36,1), opacity 0.8s ease 0.2s, padding 1s cubic-bezier(0.22,1,0.36,1)',
                    padding: pulled ? '30px 0 0' : '0',
                }}>
                    <div style={{ position: 'relative' }}>
                        {/* wax-seal crest stamped at the top edge */}
                        <div style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}>
                            <SealCrest tc={tc} visible={pulled} />
                        </div>

                        <div className="legacy-parchment" style={{
                            position: 'relative',
                            background: `
                                radial-gradient(ellipse at 15% 15%, rgba(180,138,70,0.10), transparent 45%),
                                radial-gradient(ellipse at 85% 30%, rgba(180,138,70,0.08), transparent 50%),
                                radial-gradient(ellipse at 30% 90%, rgba(150,110,60,0.09), transparent 55%),
                                radial-gradient(ellipse at 90% 95%, rgba(150,110,60,0.07), transparent 45%),
                                linear-gradient(180deg,#fffdf6,#f7ecce)
                            `,
                            borderRadius: '6px',
                            boxShadow: pulled
                                ? 'inset 0 0 0 1px rgba(201,162,39,0.55), inset 0 0 0 6px rgba(255,253,246,0.9), inset 0 0 0 7px rgba(201,162,39,0.4), inset 0 0 70px rgba(120,90,50,0.1), 0 26px 55px rgba(0,0,0,0.16)'
                                : 'none',
                            padding: pulled ? '3.5rem 3.5rem 3rem' : '0 3.5rem',
                            overflow: 'hidden',
                        }}>
                            <CornerFlourish color={`${tc.primary}80`} style={{ top: '10px', left: '10px' }} />
                            <CornerFlourish color={`${tc.primary}80`} style={{ top: '10px', right: '10px', transform: 'scaleX(-1)' }} />
                            <CornerFlourish color={`${tc.primary}80`} style={{ bottom: '10px', left: '10px', transform: 'scaleY(-1)' }} />
                            <CornerFlourish color={`${tc.primary}80`} style={{ bottom: '10px', right: '10px', transform: 'scale(-1,-1)' }} />

                            <div className="rte-content legacy-text" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '18px', color: '#5b4636', lineHeight: 2, overflowWrap: 'break-word', textAlign: 'left', position: 'relative', zIndex: 1 }}
                                dangerouslySetInnerHTML={{ __html: description }} />
                        </div>
                    </div>
                </div>
            </Reveal>
        </div>
    );
};

// ── Single alumnus entry — alternates photo left/right for visual rhythm ──
const AlumnusEntry = ({ alumnus, index, tc }) => {
    const imageOnRight = index % 2 === 1;

    const tilt = (index % 2 === 0 ? -1 : 1) * (2.5 + (index % 3));

    const photoBlock = (
        <Reveal delay={0.05}>
            <div className="alumni-photo-wrap" style={{ position: 'relative', width: 'fit-content', transform: `rotate(${tilt}deg)`, transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
                <div style={{
                    position: 'absolute', inset: '-8px', borderRadius: '4px',
                    background: '#ffffff', boxShadow: '0 14px 30px rgba(0,0,0,0.14)'
                }}></div>
                <div className="alumni-photo-inner" style={{ position: 'relative', width: '210px', height: '230px', borderRadius: '2px', overflow: 'hidden', background: tc.light, transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
                    {alumnus.photo ? (
                        <img src={alumnus.photo} alt={alumnus.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                        <div style={{
                            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`
                        }}>
                            <span style={{ fontSize: '40px', fontWeight: 800, color: '#ffffff', fontFamily: "'Playfair Display', Georgia, serif" }}>
                                {alumnus.name ? alumnus.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Reveal>
    );

    const textBlock = (
        <Reveal delay={0.15} style={{ flex: 1 }}>
            <div>
                <h3 className="alumni-name" style={{
                    fontSize: 'clamp(24px,3vw,32px)', fontWeight: 800, color: tc.dark,
                    letterSpacing: '-0.5px', marginBottom: '14px', lineHeight: 1.2
                }}>
                    {alumnus.name}
                </h3>
                {alumnus.batchYear && (
                    <p style={{ fontSize: '11.5px', color: tc.primary, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
                        Batch of {alumnus.batchYear}
                    </p>
                )}
                {alumnus.achievementHeadline && (
                    <p style={{ fontSize: '16.5px', fontWeight: 700, color: '#1e293b', lineHeight: 1.6, marginBottom: '14px' }}>
                        {alumnus.achievementHeadline}
                    </p>
                )}
                {alumnus.testimonial && (
                    <p style={{ fontSize: '15px', color: '#1e293b', lineHeight: 1.85 }}>
                        {alumnus.testimonial}
                    </p>
                )}
                {alumnus.linkedinUrl && (
                    <a href={alumnus.linkedinUrl} target="_blank" rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '7px', marginTop: '18px',
                            fontSize: '13px', fontWeight: 700, color: tc.primary, textDecoration: 'none'
                        }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zM8.34 18V9.94H5.7V18h2.64zM7.03 8.78a1.53 1.53 0 100-3.06 1.53 1.53 0 000 3.06zM18.31 18v-4.36c0-2.33-1.25-3.42-2.91-3.42a2.5 2.5 0 00-2.27 1.26h-.03V9.94h-2.53c.03.71 0 8.06 0 8.06h2.53v-4.5c0-.24.02-.48.09-.65.2-.48.65-.99 1.4-.99.99 0 1.39.75 1.39 1.86V18h2.53z" />
                        </svg>
                        Connect on LinkedIn
                    </a>
                )}
            </div>
        </Reveal>
    );

    return (
        <div style={{ display: 'flex', gap: '3.5rem', alignItems: 'flex-start', flexDirection: imageOnRight ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
            {photoBlock}
            {textBlock}
        </div>
    );
};

const AlumniPublic = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);

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
                const contentRes = await getPublicModuleContentApi(res.data.id, 'alumni');
                if (contentRes.data?.alumni?.length > 0) setContent(contentRes.data);
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

    if (!content) return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'system-ui, sans-serif' }}>
            <p style={{ fontSize: '18px', color: '#64748b' }}>Alumni page not published yet</p>
            <button onClick={() => navigate(`/school/${slug}`)}
                style={{ padding: '12px 28px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                ← Back to Home
            </button>
        </div>
    );

    const alumni = (content.alumni || []).filter(a => a.name);

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap" rel="stylesheet" />
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                body { background: #ffffff; }
                .alumni-name { font-family: 'Playfair Display', Georgia, serif; }
                .rte-content p { margin-bottom: 0.8em; }
                .rte-content p:last-child { margin-bottom: 0; }
                .rte-content strong { font-weight: 700; }
                .rte-content em { font-style: italic; }
                .rte-content u { text-decoration: underline; }
                .rte-content ul, .rte-content ol { padding-left: 1.5em; margin-bottom: 0.8em; }
                .rte-content .ql-size-small { font-size: 0.75em; }
                .rte-content .ql-size-large { font-size: 1.5em; }
                .rte-content .ql-size-huge { font-size: 2.5em; }
                .legacy-text p:first-of-type::first-letter {
                    font-family: 'Playfair Display', Georgia, serif;
                    font-style: normal; font-weight: 800; font-size: 3.6em; line-height: 0.75;
                    float: left; margin: 0.06em 0.1em 0 0; color: ${tc.primary};
                }
                .alumni-photo-wrap:hover { transform: rotate(0deg) !important; }
                .alumni-photo-wrap:hover .alumni-photo-inner { transform: scale(1.05); }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="alumni" />

                {/* ── Hero — full page height, consistent with Achievements/Sports ── */}
                <div style={{ height: '90vh', position: 'relative', overflow: 'hidden' }}>
                    {content.banner ? (
                        <img src={content.banner} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${tc.dark},${tc.primary})` }}></div>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.35) 60%, #ffffff 100%)' }}></div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 2rem' }}>
                        <p style={{ fontSize: '13px', color: '#fff', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '20px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                            {school.name}
                        </p>
                        <h1 className="alumni-name" style={{ fontSize: 'clamp(44px, 7vw, 96px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.05, color: '#ffffff', textShadow: '0 4px 30px rgba(0,0,0,0.3)', fontStyle: content.headingItalic ? 'italic' : 'normal' }}>
                            {content.heading || 'Alumni Community'}
                        </h1>
                    </div>
                    <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)' }}>
                        <svg width="22" height="22" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                    </div>
                </div>

                {/* ── Description — sealed under a draggable pin, unrolls like a scroll ── */}
                {content.description && (
                    <div style={{ padding: '6.5rem 3rem 2rem', background: '#ffffff' }}>
                        <LegacyScroll description={content.description} tc={tc} />
                    </div>
                )}

                {/* ── Alumni list — vertical list, alternating photo position, ornamental dividers ── */}
                <div style={{ padding: content.description ? '3rem 3rem 7rem' : '7rem 3rem' }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        {alumni.map((al, i) => (
                            <div key={al.id}>
                                <AlumnusEntry alumnus={al} index={i} tc={tc} />
                                <OrnamentalDivider color={`${tc.primary}90`} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default AlumniPublic;