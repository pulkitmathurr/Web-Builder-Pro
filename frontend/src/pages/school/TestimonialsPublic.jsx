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
        const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.15 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, visible];
};

const Reveal = ({ children, delay = 0, style = {} }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.65s ease ${delay}s, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>
            {children}
        </div>
    );
};

const StarRow = ({ rating, color }) => (
    <div style={{ display: 'flex', gap: '3px' }}>
        {[1, 2, 3, 4, 5].map(star => (
            <svg key={star} width="15" height="15" viewBox="0 0 24 24"
                fill={star <= (rating || 0) ? color : 'none'}
                stroke={star <= (rating || 0) ? color : '#d1d5db'} strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5l2.9 6 6.6.7-4.9 4.6 1.2 6.5L12 16.9l-5.8 3.4 1.2-6.5-4.9-4.6 6.6-.7L12 2.5z" />
            </svg>
        ))}
    </div>
);

const TYPE_LABELS = { parent: 'Parent', alumni: 'Alumni', visitor: 'Visitor' };
const TYPE_BADGE_COLORS = {
    visitor: { bg: '#eff6ff', text: '#2563eb' },
    alumni: { bg: '#fdf4ff', text: '#a21caf' },
};

// ── Extracts a YouTube video ID from watch/share/embed style URLs so we can build an embeddable iframe src ──
const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
};

// ── Single text testimonial card — quote mark, avatar (photo or initials), name/role, type badge, rating ──
const TestimonialCard = ({ t, index, tc }) => {
    const initials = t.name ? t.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';
    const typeLabel = TYPE_LABELS[t.type] || 'Parent';
    const badgeColor = TYPE_BADGE_COLORS[t.type] || { bg: `${tc.primary}12`, text: tc.primary };

    return (
        <Reveal delay={Math.min(index, 6) * 0.06} style={{ height: '100%' }}>
            <div style={{
                background: '#ffffff', borderRadius: '18px', padding: '2rem 1.75rem', height: '100%',
                display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(15,23,42,0.06)',
                border: '0.5px solid #f1f5f9', position: 'relative',
            }}>
                <svg width="34" height="26" viewBox="0 0 34 26" fill="none" style={{ marginBottom: '14px', opacity: 0.9 }}>
                    <path d="M0 26V15.6C0 6.9 5.4 1.3 13.5 0l1.6 3.9C9.4 5.3 6.6 8.9 6.2 14h7.3v12H0zm18.5 0V15.6c0-8.7 5.4-14.3 13.5-15.6L33.6 3.9c-5.7 1.4-8.5 5-8.9 10.1H32v12H18.5z" fill={tc.primary} />
                </svg>

                {t.quote && (
                    <div className="rte-content" style={{ fontSize: '14.5px', color: '#334155', lineHeight: 1.8, flex: 1, marginBottom: '18px' }}
                        dangerouslySetInnerHTML={{ __html: t.quote }} />
                )}
                {!t.quote && <div style={{ flex: 1 }} />}

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})` }}>
                        {t.photo ? (
                            <img src={t.photo} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{initials}</span>
                        )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>{t.name}</p>
                        <p style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                            {t.role || typeLabel}
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
                        <span style={{
                            fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                            padding: '3px 8px', borderRadius: '999px',
                            background: badgeColor.bg,
                            color: badgeColor.text,
                        }}>
                            {typeLabel}
                        </span>
                        {!!t.rating && <StarRow rating={t.rating} color="#f59e0b" />}
                    </div>
                </div>
            </div>
        </Reveal>
    );
};

// ── Video testimonial card — premium "frame" treatment: a theme-tinted dark panel
// holding a rectangular thumbnail (with play button), sitting inside a light,
// theme-tinted outer card so the panel's edge reads as a crisp, visible border —
// not just a soft drop-shadow. No avatar initials — just name/role/rating below. ──
const VideoTestimonialCard = ({ t, index, tc, onPlay }) => {
    const typeLabel = TYPE_LABELS[t.type] || 'Parent';

    return (
        <Reveal delay={Math.min(index, 6) * 0.06} style={{ height: '100%' }}>
            <div className="video-testi-card" onClick={() => onPlay(t)} style={{
                background: tc.light, borderRadius: '20px', overflow: 'hidden', height: '100%',
                display: 'flex', flexDirection: 'column', boxShadow: '0 6px 24px rgba(15,23,42,0.10)',
                border: `1.5px solid ${tc.primary}45`, cursor: 'pointer', padding: '8px',
            }}>
                <div style={{
                    position: 'relative', borderRadius: '14px', overflow: 'hidden', aspectRatio: '16/10',
                    background: t.thumbnail ? `url(${t.thumbnail}) center/cover` : `linear-gradient(160deg, ${tc.dark} 0%, ${tc.primary} 100%)`,
                    border: `1px solid ${tc.secondary}55`,
                }}>
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${tc.dark}00 45%, ${tc.dark}cc 100%)` }} />
                    <span style={{ position: 'absolute', top: '10px', left: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', background: `${tc.primary}99`, border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', padding: '4px 9px', borderRadius: '999px' }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                        Video
                    </span>
                    <div className="video-testi-play" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 18px ${tc.dark}80` }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={tc.primary}><path d="M8 5v14l11-7z" /></svg>
                    </div>
                </div>
                <div style={{ padding: '14px 10px 8px' }}>
                    <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '2px' }}>
                        <p style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.role || typeLabel}</p>
                        {!!t.rating && <StarRow rating={t.rating} color="#f59e0b" />}
                    </div>
                </div>
            </div>
        </Reveal>
    );
};

const TestimonialsPublic = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const [videoModal, setVideoModal] = useState(null);
    const [tab, setTab] = useState('text');

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
                const contentRes = await getPublicModuleContentApi(res.data.id, 'testimonials');
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

    if (!isModuleEnabled(school, 'testimonials')) return <NotPublished tc={tc} slug={slug} label="Testimonials" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Testimonials" />;

    const testimonials = (content.testimonials || []).filter(t => t.name);
    const videoTestimonials = (content.videoTestimonials || []).filter(t => t.name && t.youtubeUrl);
    const embedUrl = videoModal ? getYoutubeEmbedUrl(videoModal.youtubeUrl) : null;
    // Falls back to whichever tab actually has content — e.g. a school with only video
    // testimonials shouldn't land on an empty "Text" tab by default.
    const effectiveTab = (tab === 'text' && testimonials.length === 0 && videoTestimonials.length > 0) ? 'video' : tab;

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                body { background: ${bc.surface}; }
                .rte-content p { margin-bottom: 0.6em; }
                .rte-content p:last-child { margin-bottom: 0; }
                .rte-content strong { font-weight: 700; }
                .rte-content em { font-style: italic; }
                .rte-content u { text-decoration: underline; }
                .rte-content .ql-size-small { font-size: 0.85em; }
                .rte-content .ql-size-large { font-size: 1.2em; }
                .rte-content .ql-size-huge { font-size: 1.5em; }
                .rte-content .ql-font-inter { font-family: 'Inter', system-ui, sans-serif; }
                .rte-content .ql-font-poppins { font-family: 'Poppins', sans-serif; }
                .rte-content .ql-font-montserrat { font-family: 'Montserrat', sans-serif; }
                .rte-content .ql-font-playfair { font-family: 'Playfair Display', Georgia, serif; }
                .rte-content .ql-font-raleway { font-family: 'Raleway', sans-serif; }
                .rte-content .ql-font-merriweather { font-family: 'Merriweather', Georgia, serif; }
                .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.75rem; }
                @media (max-width: 960px) { .testimonials-grid { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 640px) { .testimonials-grid { grid-template-columns: 1fr; } }
                .video-testi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
                @media (max-width: 1180px) { .video-testi-grid { grid-template-columns: repeat(3, 1fr); } }
                @media (max-width: 860px) { .video-testi-grid { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 520px) { .video-testi-grid { grid-template-columns: 1fr; } }
                .video-testi-card { transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease, border-color 0.25s ease; }
                .video-testi-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(15,23,42,0.10); border-color: ${tc.primary}40; }
                .video-testi-card:hover .video-testi-play { transform: scale(1.08); }
                .video-testi-play { transition: transform 0.2s ease; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="testimonials" />

                {/* ── Header — no banner photo, clean gradient header (matches About Us) ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'calc(92px + 1.6rem) clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: content.headingFont ? getFontFamily(content.headingFont) : "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: content.headingColor || '#ffffff', letterSpacing: '-1px', marginBottom: '10px', fontStyle: content.headingItalic ? 'italic' : 'normal' }}>
                            {content.heading || 'What People Say About Us'}
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* ── Text / Video tabs — only shown when both kinds exist ── */}
                {testimonials.length > 0 && videoTestimonials.length > 0 && (
                    <div style={{ padding: '2.5rem clamp(1.25rem,6vw,3rem) 0', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ display: 'inline-flex', background: bc.card, border: '1px solid #e5e9f0', borderRadius: '11px', padding: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            {[
                                { key: 'text', label: 'Text Testimonials', count: testimonials.length },
                                { key: 'video', label: 'Video Testimonials', count: videoTestimonials.length },
                            ].map(t => {
                                const active = effectiveTab === t.key;
                                return (
                                    <button key={t.key} onClick={() => setTab(t.key)}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '7px',
                                            padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                            fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em',
                                            background: active ? `linear-gradient(135deg,${tc.primary},${tc.secondary})` : 'transparent',
                                            color: active ? '#ffffff' : '#64748b',
                                            boxShadow: active ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                                        }}>
                                        {t.label}
                                        <span style={{
                                            fontSize: '10.5px', fontWeight: 700, padding: '1px 6px', borderRadius: '999px',
                                            background: active ? 'rgba(255,255,255,0.22)' : '#eef1f6', color: active ? '#ffffff' : '#94a3b8',
                                        }}>{t.count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Active grid ── */}
                <div style={{ padding: '3rem clamp(1.25rem,6vw,3rem) 7rem' }}>
                    <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
                        {testimonials.length === 0 && videoTestimonials.length === 0 ? (
                            <p style={{ textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>No testimonials yet — check back soon.</p>
                        ) : effectiveTab === 'video' && videoTestimonials.length > 0 ? (
                            <div className="video-testi-grid">
                                {videoTestimonials.map((t, i) => (
                                    <VideoTestimonialCard key={t.id} t={t} index={i} tc={tc} onPlay={setVideoModal} />
                                ))}
                            </div>
                        ) : (
                            <div className="testimonials-grid">
                                {testimonials.map((t, i) => (
                                    <TestimonialCard key={t.id} t={t} index={i} tc={tc} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Video Lightbox ── */}
                {videoModal && (
                    <div onClick={() => setVideoModal(null)}
                        style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', animation: 'fadeIn 0.25s ease' }}>
                        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '860px', aspectRatio: '16/9', background: '#000', borderRadius: '14px', overflow: 'hidden', position: 'relative' }}>
                            {embedUrl && (
                                <iframe src={embedUrl} title={videoModal.name} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
                                    style={{ width: '100%', height: '100%', border: 'none' }} />
                            )}
                        </div>
                        <button onClick={() => setVideoModal(null)}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                )}

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default TestimonialsPublic;
