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

// ── Ornamental divider between leadership messages (same motif used on the Alumni page) ──
const OrnamentalDivider = ({ color }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <svg width="100%" height="20" viewBox="0 0 600 20" preserveAspectRatio="none" style={{ maxWidth: '560px' }}>
            <line x1="6" y1="10" x2="265" y2="10" stroke={color} strokeWidth="1.2" />
            <line x1="335" y1="10" x2="594" y2="10" stroke={color} strokeWidth="1.2" />
            <path d="M0 10 L10 5 L10 15 Z" fill={color} />
            <path d="M600 10 L590 5 L590 15 Z" fill={color} />
            <g transform="translate(300,10)">
                <circle cx="-14" cy="0" r="6" fill="none" stroke={color} strokeWidth="1.3" />
                <circle cx="-5" cy="0" r="6" fill="none" stroke={color} strokeWidth="1.3" />
                <circle cx="5" cy="0" r="6" fill="none" stroke={color} strokeWidth="1.3" />
                <circle cx="14" cy="0" r="6" fill="none" stroke={color} strokeWidth="1.3" />
            </g>
        </svg>
    </div>
);

const AboutUsPublic = () => {
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
                const contentRes = await getPublicModuleContentApi(res.data.id, 'about');
                setContent(contentRes.data);
            }
        } catch (e) {
            navigate('/school-not-found');
        } finally {
            setLoading(false);
        }
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
                <p style={{ fontSize: '20px', color: '#64748b' }}>About Us page not published yet</p>
                <button onClick={() => navigate(`/school/${slug}`)}
                    style={{ padding: '12px 28px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    ← Back to Home
                </button>
            </div>
        );
    }

    const values = (content.values || []).filter(v => v.title);
    const tickerItems = (content.visionMissionItems || []).filter(it => it.heading && it.text && it.text.replace(/<[^>]*>/g, '').trim().length > 0);
    const leaders = (content.leadershipMembers || []).filter(m => m.name || m.message);

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes float3d { 0%,100% { transform: translateY(0) rotateX(0deg); } 50% { transform: translateY(-10px) rotateX(2deg); } }
                @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                body { background: #ffffff; }
                .value-card {
                    transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease;
                    transform-style: preserve-3d;
                }
                .value-card:hover {
                    transform: translateY(-10px) rotateX(4deg) rotateY(-2deg);
                    box-shadow: 0 30px 60px rgba(0,0,0,0.1);
                }
                .ticker-track {
                    display: flex;
                    width: max-content;
                    animation: tickerScroll 40s linear infinite;
                }
                .ticker-track:hover { animation-play-state: paused; }
                @keyframes historyFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
                .history-frame { position: relative; padding: 14px; animation: historyFloat 5s ease-in-out infinite; }
                .history-frame::before {
                    content: ''; position: absolute; inset: 0; border: 1.5px solid ${tc.primary}55;
                    border-radius: 20px; transition: inset 0.5s cubic-bezier(0.16,1,0.3,1), border-color 0.5s ease;
                }
                .history-frame:hover::before { inset: -9px; border-color: ${tc.primary}; }
                .history-frame-inner { position: relative; border-radius: 14px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.14); }
                .history-frame-inner img { width: 100%; height: 280px; object-fit: cover; display: block; transition: transform 0.7s cubic-bezier(0.16,1,0.3,1); }
                .history-frame:hover .history-frame-inner img { transform: scale(1.07); }
                .history-frame-inner::after {
                    content: ''; position: absolute; inset: 0; z-index: 2; pointer-events: none;
                    background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 46%, transparent 62%);
                    transform: translateX(-130%); transition: transform 0.9s ease;
                }
                .history-frame:hover .history-frame-inner::after { transform: translateX(130%); }
                .frame-corner { position: absolute; width: 22px; height: 22px; z-index: 3; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); }
                .corner-tl { top: -6px; left: -6px; border-top: 3px solid ${tc.primary}; border-left: 3px solid ${tc.primary}; }
                .corner-tr { top: -6px; right: -6px; border-top: 3px solid ${tc.primary}; border-right: 3px solid ${tc.primary}; }
                .corner-bl { bottom: -6px; left: -6px; border-bottom: 3px solid ${tc.primary}; border-left: 3px solid ${tc.primary}; }
                .corner-br { bottom: -6px; right: -6px; border-bottom: 3px solid ${tc.primary}; border-right: 3px solid ${tc.primary}; }
                .history-frame:hover .corner-tl { top: -13px; left: -13px; }
                .history-frame:hover .corner-tr { top: -13px; right: -13px; }
                .history-frame:hover .corner-bl { bottom: -13px; left: -13px; }
                .history-frame:hover .corner-br { bottom: -13px; right: -13px; }

                .leader-frame { position: relative; padding: 10px; background: #ffffff; border-radius: 16px; box-shadow: 0 18px 42px rgba(0,0,0,0.12); transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease; }
                .leader-frame::before { content: ''; position: absolute; inset: 6px; border: 1.5px solid ${tc.primary}50; border-radius: 11px; pointer-events: none; z-index: 2; }
                .leader-frame:hover { transform: translateY(-6px); box-shadow: 0 26px 55px rgba(0,0,0,0.16); }
                .leader-frame-inner { border-radius: 9px; overflow: hidden; position: relative; }
                .leader-frame-inner img { transition: transform 0.6s cubic-bezier(0.16,1,0.3,1); }
                .leader-frame:hover .leader-frame-inner img { transform: scale(1.05); }
                .leader-badge { position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%); width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg,${tc.primary},${tc.secondary}); display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px ${tc.primary}55; z-index: 3; }
                .rte-content { overflow-wrap: break-word; }
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
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="about" />

                {/* ── About header — no banner photo, just a clean gradient header ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: '7rem 3rem 2rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '10px' }}>
                            {school.name}
                        </p>
                        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-1px', marginBottom: '10px' }}>
                            About Us
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* ── Horizontal Ticker — Vision/Mission/etc (admin-defined items) ── */}
                {tickerItems.length > 0 && (
                    <div style={{ padding: '2rem 0', background: tc.light, overflow: 'hidden', position: 'relative' }}>
                        <Reveal>
                            <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '1rem', textAlign: 'center', fontWeight: 700 }}>What Drives Us</p>
                        </Reveal>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100px', background: `linear-gradient(90deg,${tc.light},transparent)`, zIndex: 2, pointerEvents: 'none' }}></div>
                            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '100px', background: `linear-gradient(270deg,${tc.light},transparent)`, zIndex: 2, pointerEvents: 'none' }}></div>

                            <div className="ticker-track">
                                {[...tickerItems, ...tickerItems].map((item, i) => (
                                    <div key={i} style={{
                                        flexShrink: 0, width: '380px', maxHeight: '170px', margin: '0 10px',
                                        background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.5rem',
                                        boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{ width: '32px', height: '3px', background: `linear-gradient(90deg,${tc.primary},${tc.secondary})`, borderRadius: '2px', marginBottom: '12px' }}></div>
                                        <h4 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.02em', marginBottom: '8px', overflowWrap: 'normal', fontStyle: item.headingItalic ? 'italic' : 'normal' }}>{item.heading}</h4>
                                        <div className="rte-content" style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.65 }}
                                            dangerouslySetInnerHTML={{ __html: item.text }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── History ── */}
                {content.history && (
                    <div style={{ padding: '2.5rem 5rem', background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle,${tc.light},transparent)`, top: '-150px', left: '-150px' }}></div>
                        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                            <Reveal>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Our Journey</p>
                                    <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1.5px', marginBottom: '8px' }}>Our History</h2>
                                    {content.foundedYear && (
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', background: tc.light, border: `1px solid ${tc.primary}30`, borderRadius: '30px', marginTop: '4px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: tc.primary }}></div>
                                            <span style={{ fontSize: '12px', color: tc.primary, fontWeight: 700, letterSpacing: '0.05em' }}>EST. {content.foundedYear}</span>
                                        </div>
                                    )}
                                </div>
                            </Reveal>
                            <div>
                                {content.historyImage && (
                                    <Reveal style={{ float: 'left', width: '280px', marginRight: '2rem', marginBottom: '1rem' }}>
                                        <div className="history-frame">
                                            <span className="frame-corner corner-tl"></span>
                                            <span className="frame-corner corner-tr"></span>
                                            <span className="frame-corner corner-bl"></span>
                                            <span className="frame-corner corner-br"></span>
                                            <div className="history-frame-inner">
                                                <img src={content.historyImage} alt="History" />
                                            </div>
                                        </div>
                                    </Reveal>
                                )}
                                <Reveal delay={0.2}>
                                    <div className="rte-content" style={{ fontSize: '16px', color: '#475569', lineHeight: 1.9, overflowWrap: 'break-word' }}
                                        dangerouslySetInnerHTML={{ __html: content.history }} />
                                </Reveal>
                                <div style={{ clear: 'both' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Leadership Messages — image styled like Alumni's polaroid photo (bigger size),
                     with the quote sign on its own line above the image+text block, and the
                     description handled exactly like the History section's read-more clamp. ── */}
                {leaders.length > 0 && (
                    <div style={{ padding: '2.5rem 5rem', background: tc.light, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                            <Reveal>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>In Their Words</p>
                                    <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1.5px' }}>Leadership Message</h2>
                                </div>
                            </Reveal>
                            {leaders.map((m, i) => {
                                const initials = m.name ? m.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';
                                return (
                                    <div key={m.id || i}>
                                        {/* Quote sign — its own line, above the image ── */}
                                        <Reveal>
                                            <svg width="30" height="30" fill={tc.primary} viewBox="0 0 24 24" style={{ marginBottom: '0.5rem', opacity: 0.5 }}>
                                                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                                            </svg>
                                        </Reveal>

                                        <div style={{ position: 'relative' }}>
                                            <Reveal delay={0.1} style={{ float: 'left', width: '220px', marginRight: '2rem', marginBottom: '1rem' }}>
                                                <div className="leader-frame">
                                                    <div className="leader-frame-inner" style={{ width: '220px', height: '260px', background: tc.light }}>
                                                        {m.photo ? (
                                                            <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                        ) : (
                                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})` }}>
                                                                <span style={{ fontSize: '52px', fontWeight: 800, color: '#ffffff', fontFamily: "'Playfair Display', Georgia, serif" }}>{initials}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="leader-badge">
                                                        <svg width="15" height="15" fill="none" stroke="#ffffff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                                    </div>
                                                </div>
                                            </Reveal>

                                            {/* Text starts right where the image starts — same row, no extra offset */}
                                            <Reveal delay={0.25}>
                                                <div className="rte-content" style={{ fontSize: '17px', color: '#334155', lineHeight: 1.9, overflowWrap: 'break-word' }}
                                                    dangerouslySetInnerHTML={{ __html: m.message }} />
                                            </Reveal>

                                            <div style={{ clear: 'both', paddingTop: '0.75rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                    <div style={{ width: '3px', height: '32px', background: `linear-gradient(180deg,${tc.primary},${tc.secondary})`, borderRadius: '2px' }}></div>
                                                    <div>
                                                        <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{m.name}</p>
                                                        <p style={{ fontSize: '12px', color: tc.primary }}>{m.designation}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {i < leaders.length - 1 && (
                                            <div style={{ margin: '1.5rem 0' }}>
                                                <OrnamentalDivider color={`${tc.primary}90`} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Core Values ── */}
                {values.length > 0 && (
                    <div style={{ padding: '2.5rem 5rem 3rem', background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                            <Reveal>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>What We Believe In</p>
                                    <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', letterSpacing: '-2px' }}>Our Core Values</h2>
                                </div>
                            </Reveal>
                            <div>
                                {values.map((v, i) => (
                                    <Reveal key={i} delay={i * 0.1}>
                                        <div style={{
                                            display: 'grid', gridTemplateColumns: '80px minmax(0,1fr)', gap: '1.5rem',
                                            padding: '1rem 0', borderTop: i === 0 ? `1px solid #e2e8f0` : 'none',
                                            borderBottom: '1px solid #e2e8f0', alignItems: 'flex-start',
                                            transition: 'padding-left 0.3s ease', cursor: 'default'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.paddingLeft = '12px'}
                                        onMouseLeave={e => e.currentTarget.style.paddingLeft = '0px'}>
                                            <span style={{
                                                fontSize: '36px', fontWeight: 800, lineHeight: 1,
                                                background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`,
                                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                            }}>
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                            <div style={{ minWidth: 0 }}>
                                                <h4 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.5px' }}>{v.title}</h4>
                                                <div className="rte-content" style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.65, maxWidth: '700px' }}
                                                    dangerouslySetInnerHTML={{ __html: v.description }} />
                                            </div>
                                        </div>
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default AboutUsPublic;
